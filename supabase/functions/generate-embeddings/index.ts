/**
 * Generate Embeddings Edge Function
 * 
 * Processes document embeddings using Vertex AI.
 * Called via HTTP POST with instruction data.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

// Configuration
const VERTEX_LOCATION = 'europe-west4'
const VERTEX_MODEL = 'text-multilingual-embedding-002'
const MAX_INPUT_CHARS = 8000
const CHUNK_SIZE = 800
const CHUNK_OVERLAP = 100

interface EmbeddingRequest {
  instructionId: string
  title: string
  content: string
  orgId: string
}

type VertexEmbeddingPrediction = {
  embeddings: { values: number[] }
}

type VertexEmbeddingResponse = {
  predictions: VertexEmbeddingPrediction[]
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
  // M-05: Removed CORS - these are server-to-server only
  const headers = {
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 204 })
  }

  // Verify Edge Function Secret (C-002 security fix: fail-hard)
  if (!EDGE_SECRET) {
    console.error('EDGE_FUNCTION_SECRET is not configured')
    return new Response(
      JSON.stringify({ error: 'Server misconfigured' }),
      { headers, status: 503 }
    )
  }
  const clientSecret = req.headers.get('X-Edge-Secret')
  if (clientSecret !== EDGE_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers, status: 401 }
    )
  }

  try {
    const payload: EmbeddingRequest = await req.json()
    console.log(`Processing embeddings for instruction: ${payload.instructionId}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const fullText = `${payload.title}\n\n${payload.content}`.slice(0, MAX_INPUT_CHARS)

    // Generate embedding with Vertex AI
    const embeddings = await generateVertexEmbedding(fullText)
    console.log(`Generated embedding with Vertex AI (${embeddings.length} dimensions)`)

    // Store full document embedding
    const { error: updateError } = await supabase
      .from('instructions')
      .update({ embedding: JSON.stringify(embeddings) })
      .eq('id', payload.instructionId)

    if (updateError) {
      throw new Error(`Failed to store embedding: ${updateError.message}`)
    }

    // Generate chunks and their embeddings
    const chunks = chunkText(payload.content)

    if (chunks.length > 0) {
      // Delete existing chunks
      await supabase
        .from('instruction_chunks')
        .delete()
        .eq('instruction_id', payload.instructionId)

      // Generate embeddings for all chunks in one batch
      const chunkTexts = chunks.map(c => `${payload.title}\n\n${c.content}`.slice(0, MAX_INPUT_CHARS))
      const chunkEmbeddings = await generateVertexEmbeddings(chunkTexts)

      // Insert chunks with embeddings
      const chunkInserts = chunks.map((chunk, idx) => ({
        instruction_id: payload.instructionId,
        chunk_index: chunk.index,
        content: chunk.content,
        embedding: JSON.stringify(chunkEmbeddings[idx])
      }))

      const { error: chunksError } = await supabase
        .from('instruction_chunks')
        .insert(chunkInserts)

      if (chunksError) {
        console.error('Failed to insert chunks:', chunksError)
      }
    }

    console.log(`Successfully processed embeddings for instruction: ${payload.instructionId}`)

    return new Response(
      JSON.stringify({
        success: true,
        instructionId: payload.instructionId,
        embeddingDimensions: embeddings.length,
        chunksProcessed: chunks.length,
        provider: 'vertex-ai'
      }),
      { headers, status: 200 }
    )

  } catch (error) {
    console.error('Error processing embeddings:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers, status: 500 }
    )
  }
})

/**
 * Generate embedding using Vertex AI
 */
async function generateVertexEmbedding(text: string): Promise<number[]> {
  const projectId = getProjectId()
  const accessToken = await getAccessToken(['https://www.googleapis.com/auth/cloud-platform'])

  const endpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:predict`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instances: [{ content: text, task_type: 'RETRIEVAL_DOCUMENT' }]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Vertex AI error: ${error}`)
  }

  const data = (await response.json()) as VertexEmbeddingResponse
  return data.predictions[0].embeddings.values
}

/**
 * Generate embeddings for multiple texts using Vertex AI (batch)
 */
async function generateVertexEmbeddings(texts: string[]): Promise<number[][]> {
  const projectId = getProjectId()
  const accessToken = await getAccessToken(['https://www.googleapis.com/auth/cloud-platform'])

  const endpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:predict`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      instances: texts.map(text => ({ content: text, task_type: 'RETRIEVAL_DOCUMENT' }))
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Vertex AI error: ${error}`)
  }

  const data = (await response.json()) as VertexEmbeddingResponse
  return data.predictions.map((prediction) => prediction.embeddings.values)
}

/**
 * Split text into overlapping chunks for better retrieval
 */
function chunkText(text: string): Array<{ index: number; content: string }> {
  if (!text || text.length <= CHUNK_SIZE) {
    return text ? [{ index: 0, content: text }] : []
  }

  const chunks: Array<{ index: number; content: string }> = []
  let start = 0
  let index = 0

  while (start < text.length) {
    let end = start + CHUNK_SIZE

    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('\n', end)
      const breakPoint = Math.max(lastPeriod, lastNewline)

      if (breakPoint > start + CHUNK_SIZE / 2) {
        end = breakPoint + 1
      }
    }

    chunks.push({
      index,
      content: text.slice(start, end).trim()
    })

    start = end - CHUNK_OVERLAP
    index++

    if (start >= text.length - CHUNK_OVERLAP) break
  }

  return chunks
}
