/**
 * Embeddings Module
 * 
 * Generates vector embeddings for semantic search using Vertex AI.
 * Uses HTTP API directly to avoid bundler compatibility issues.
 */

import { getGoogleAuthOptions, getProjectId } from './vertex-auth'
import { aiLogger, createTimer } from './logger'

// Configuration
const VERTEX_LOCATION = 'europe-west4'
const VERTEX_MODEL = 'text-multilingual-embedding-002'
const MAX_INPUT_CHARS = 8000

// Cache for access token
let cachedAccessToken: { token: string; expiry: number } | null = null

/**
 * Get an access token for Vertex AI API
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && cachedAccessToken.expiry > Date.now() + 300000) {
    return cachedAccessToken.token
  }

  const auth = getGoogleAuthOptions()
  
  // Create JWT for service account auth
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: auth.credentials.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }
  
  const base64url = (obj: object) => {
    const json = JSON.stringify(obj)
    const base64 = Buffer.from(json).toString('base64')
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  
  const encodedHeader = base64url(header)
  const encodedPayload = base64url(payload)
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  
  // Sign with private key
  const crypto = await import('crypto')
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signatureInput)
  const signature = sign.sign(auth.credentials.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  const jwt = `${signatureInput}.${signature}`
  
  // Exchange JWT for access token
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
  
  // Cache the token
  cachedAccessToken = {
    token: tokenData.access_token,
    expiry: Date.now() + (tokenData.expires_in * 1000)
  }
  
  return tokenData.access_token
}

type VertexEmbeddingPrediction = {
  embeddings: { values: number[] }
}

type VertexEmbeddingResponse = {
  predictions: VertexEmbeddingPrediction[]
}

/**
 * Generate an embedding vector for the given text using Vertex AI.
 * 
 * @param text - The text to generate an embedding for
 * @returns A 768-dimensional vector representing the text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text')
  }

  const timer = createTimer(aiLogger, 'generate_embedding')
  const truncatedText = text.slice(0, MAX_INPUT_CHARS)

  try {
    const projectId = getProjectId()
    const accessToken = await getAccessToken()
    
    const endpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:predict`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{ content: truncatedText, task_type: 'RETRIEVAL_DOCUMENT' }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vertex AI error: ${error}`)
    }

    const data = (await response.json()) as VertexEmbeddingResponse
    const embedding = data.predictions[0].embeddings.values
    
    timer.end({ provider: 'vertex-ai', dimensions: embedding.length })
    return embedding
  } catch (error) {
    timer.fail(error, { provider: 'vertex-ai' })
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate embeddings for multiple texts in a single batch using Vertex AI.
 * More efficient than calling generateEmbedding multiple times.
 * 
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of 768-dimensional vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return []
  }

  const timer = createTimer(aiLogger, 'generate_embeddings_batch')
  const truncatedTexts = texts.map(t => (t || '').slice(0, MAX_INPUT_CHARS))

  try {
    const projectId = getProjectId()
    const accessToken = await getAccessToken()
    
    const endpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:predict`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: truncatedTexts.map(text => ({ content: text, task_type: 'RETRIEVAL_DOCUMENT' }))
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vertex AI error: ${error}`)
    }

    const data = (await response.json()) as VertexEmbeddingResponse
    const embeddings = data.predictions.map(p => p.embeddings.values)
    
    timer.end({ provider: 'vertex-ai', count: texts.length, dimensions: embeddings[0]?.length })
    return embeddings
  } catch (error) {
    timer.fail(error, { provider: 'vertex-ai' })
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate an embedding for a search query.
 * Uses RETRIEVAL_QUERY task type for better search performance.
 * 
 * @param query - The search query
 * @returns A 768-dimensional vector for the query
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty query')
  }

  const timer = createTimer(aiLogger, 'generate_query_embedding')
  const truncatedQuery = query.slice(0, MAX_INPUT_CHARS)

  try {
    const projectId = getProjectId()
    const accessToken = await getAccessToken()
    
    const endpoint = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:predict`
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instances: [{ content: truncatedQuery, task_type: 'RETRIEVAL_QUERY' }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Vertex AI error: ${error}`)
    }

    const data = (await response.json()) as VertexEmbeddingResponse
    const embedding = data.predictions[0].embeddings.values
    
    timer.end({ provider: 'vertex-ai', dimensions: embedding.length })
    return embedding
  } catch (error) {
    timer.fail(error, { provider: 'vertex-ai' })
    throw new Error(
      `Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Prepare text for embedding by combining title and content.
 * This ensures consistent formatting for both indexing and querying.
 * 
 * @param title - The instruction title
 * @param content - The instruction content (optional)
 * @returns Formatted text ready for embedding
 */
export function prepareTextForEmbedding(title: string, content?: string | null): string {
  const parts = [title]
  if (content && content.trim()) {
    parts.push(content.trim())
  }
  return parts.join('\n\n')
}

/**
 * Get the current embedding provider being used
 */
export function getEmbeddingProvider(): 'vertex-ai' | 'none' {
  if (process.env.GOOGLE_CREDENTIALS_JSON) return 'vertex-ai'
  return 'none'
}
