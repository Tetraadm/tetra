/**
 * Vertex AI Search Edge Function
 * 
 * Performs semantic search using Google Vertex AI Search (Discovery Engine).
 * Supports grounding for LLM responses with citations.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Configuration
const LOCATION = 'global' // Vertex AI Search is typically global
const DATA_STORE_ID = Deno.env.get('VERTEX_DATA_STORE_ID')
const SEARCH_APP_ID = Deno.env.get('VERTEX_SEARCH_APP_ID')

interface SearchRequest {
  query: string
  limit?: number
  includeAnswer?: boolean // Enable grounded answer generation
  orgId?: string // For filtering by organization
}

interface SearchResult {
  id: string
  title: string
  content: string
  link?: string
  score: number
  citations?: string[]
}

interface SearchResponse {
  results: SearchResult[]
  answer?: string // Grounded answer if requested
  citations?: Array<{ title: string; uri: string }>
}

// ========== Google Auth ==========
function getProjectId(): string {
  const credentialsJson = Deno.env.get('GOOGLE_CREDENTIALS_JSON')
  if (!credentialsJson) throw new Error('GOOGLE_CREDENTIALS_JSON not set')
  return JSON.parse(credentialsJson).project_id
}

async function getAccessToken(scopes: string[]): Promise<string> {
  const credentialsJson = Deno.env.get('GOOGLE_CREDENTIALS_JSON')
  if (!credentialsJson) throw new Error('GOOGLE_CREDENTIALS_JSON not set')
  const credentials = JSON.parse(credentialsJson)
  
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }
  
  const base64url = (obj: object) => {
    const json = JSON.stringify(obj)
    const base64 = btoa(json)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  
  const encodedHeader = base64url(header)
  const encodedPayload = base64url(payload)
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  
  const privateKey = credentials.private_key
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  const binaryKey = Uint8Array.from(atob(keyData), (c: string) => c.charCodeAt(0))
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  )
  
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  const jwt = `${signatureInput}.${signature}`
  
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })
  
  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${error}`)
  }
  
  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}
// ========== End Google Auth ==========

// Edge Function Secret for internal auth (H-001 security fix)
const EDGE_SECRET = Deno.env.get('EDGE_FUNCTION_SECRET')

serve(async (req: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-edge-secret',
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  // Verify Edge Function Secret (H-001 security fix)
  const clientSecret = req.headers.get('X-Edge-Secret')
  if (EDGE_SECRET && clientSecret !== EDGE_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers, status: 401 }
    )
  }

  try {
    const payload: SearchRequest = await req.json()
    const { query, limit = 5, includeAnswer = false } = payload

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { headers, status: 400 }
      )
    }

    console.log(`Vertex Search: "${query}" (limit: ${limit}, includeAnswer: ${includeAnswer})`)

    const projectId = getProjectId()
    const accessToken = await getAccessToken(['https://www.googleapis.com/auth/cloud-platform'])

    // Build the serving config path
    let servingConfig: string
    if (SEARCH_APP_ID) {
      // Use Search App (Engine)
      servingConfig = `projects/${projectId}/locations/${LOCATION}/collections/default_collection/engines/${SEARCH_APP_ID}/servingConfigs/default_search`
    } else if (DATA_STORE_ID) {
      // Use Data Store directly
      servingConfig = `projects/${projectId}/locations/${LOCATION}/collections/default_collection/dataStores/${DATA_STORE_ID}/servingConfigs/default_search`
    } else {
      throw new Error('Either VERTEX_SEARCH_APP_ID or VERTEX_DATA_STORE_ID must be set')
    }

    const endpoint = `https://discoveryengine.googleapis.com/v1/${servingConfig}:search`

    // Build search request body
    const searchBody: Record<string, unknown> = {
      query: query,
      pageSize: limit,
      contentSearchSpec: {
        snippetSpec: {
          returnSnippet: true,
          maxSnippetCount: 3
        },
        extractiveContentSpec: {
          maxExtractiveAnswerCount: 1,
          maxExtractiveSegmentCount: 3
        }
      },
      queryExpansionSpec: {
        condition: 'AUTO' // Automatic query expansion
      },
      spellCorrectionSpec: {
        mode: 'AUTO' // Automatic spell correction
      }
    }

    // Add summary generation if requested (grounded answer)
    if (includeAnswer) {
      searchBody.contentSearchSpec = {
        ...searchBody.contentSearchSpec as object,
        summarySpec: {
          summaryResultCount: Math.min(limit, 5),
          includeCitations: true,
          ignoreAdversarialQuery: true,
          ignoreNonSummarySeekingQuery: false,
          modelPromptSpec: {
            preamble: 'Du er en HMS-assistent. Svar på norsk basert på dokumentene. Hvis du ikke finner svaret, si det.'
          },
          languageCode: 'no' // Norwegian
        }
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vertex Search API error:', errorText)
      throw new Error(`Vertex Search API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`Vertex Search returned ${data.results?.length || 0} results`)

    // Parse results
    const results: SearchResult[] = (data.results || []).map((result: Record<string, unknown>, index: number) => {
      const document = result.document as Record<string, unknown> | undefined
      const derivedData = document?.derivedStructData as Record<string, unknown> | undefined
      const structData = document?.structData as Record<string, unknown> | undefined

      // Extract title
      let title = 'Uten tittel'
      if (derivedData?.title) {
        title = String(derivedData.title)
      } else if (structData?.title) {
        title = String(structData.title)
      } else if (document?.name) {
        // Extract from document name (last part of path)
        const name = String(document.name)
        title = name.split('/').pop() || name
      }

      // Extract content/snippet
      let content = ''
      const snippets = derivedData?.snippets as Array<Record<string, unknown>> | undefined
      if (snippets && snippets.length > 0) {
        content = snippets.map(s => String(s.snippet || '')).join(' ... ')
      }
      
      const extractiveAnswers = derivedData?.extractive_answers as Array<Record<string, unknown>> | undefined
      if (!content && extractiveAnswers && extractiveAnswers.length > 0) {
        content = String(extractiveAnswers[0].content || '')
      }

      // Extract link/URI
      let link = ''
      if (derivedData?.link) {
        link = String(derivedData.link)
      } else if (document?.uri) {
        link = String(document.uri)
      }

      // Clean HTML tags from content
      content = content.replace(/<[^>]*>/g, '')

      return {
        id: String(result.id || `result-${index}`),
        title,
        content,
        link,
        score: 0.9 - (index * 0.1) // Descending score based on rank
      }
    })

    // Build response
    const searchResponse: SearchResponse = { results }

    // Add grounded answer if available
    if (includeAnswer && data.summary) {
      searchResponse.answer = data.summary.summaryText || ''
      
      // Extract citations
      if (data.summary.summaryWithMetadata?.citationMetadata?.citations) {
        searchResponse.citations = data.summary.summaryWithMetadata.citationMetadata.citations.map(
          (citation: Record<string, unknown>) => ({
            title: String(citation.title || ''),
            uri: String(citation.uri || '')
          })
        )
      }
    }

    return new Response(
      JSON.stringify(searchResponse),
      { headers, status: 200 }
    )

  } catch (error) {
    console.error('Vertex Search error:', error)
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message,
        results: []
      }),
      { headers, status: 500 }
    )
  }
})
