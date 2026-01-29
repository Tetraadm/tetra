/**
 * Gemini Chat Edge Function
 * 
 * Generates AI responses using Gemini 2.0 Flash.
 * Supports both streaming and non-streaming modes.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Configuration
const LOCATION = 'europe-west4'
const MODEL_NAME = 'gemini-2.0-flash-001'

interface ChatRequest {
  systemPrompt: string
  userMessage: string
  stream?: boolean
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
    const payload: ChatRequest = await req.json()
    const { systemPrompt, userMessage } = payload
    // Note: streaming not implemented yet, but parameter accepted for future use

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: 'userMessage is required' }),
        { headers, status: 400 }
      )
    }

    const projectId = getProjectId()
    const accessToken = await getAccessToken(['https://www.googleapis.com/auth/cloud-platform'])

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${LOCATION}/publishers/google/models/${MODEL_NAME}:generateContent`

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        topP: 0.8,
        topK: 40
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
      ]
    }

    console.log(`Gemini chat: ${userMessage.substring(0, 50)}...`)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()

    // Extract the generated text
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!generatedText) {
      console.warn('Gemini returned empty response', JSON.stringify(data))
      return new Response(
        JSON.stringify({
          answer: '',
          error: 'Empty response from Gemini'
        }),
        { headers, status: 200 }
      )
    }

    console.log(`Gemini response: ${generatedText.substring(0, 100)}...`)

    return new Response(
      JSON.stringify({ answer: generatedText }),
      { headers, status: 200 }
    )

  } catch (error) {
    console.error('Gemini chat error:', error)
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        answer: ''
      }),
      { headers, status: 500 }
    )
  }
})
