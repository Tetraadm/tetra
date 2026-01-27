/**
 * Generate Embeddings Edge Function
 * 
 * Processes document embeddings asynchronously using Vertex AI or OpenAI.
 * Called via HTTP POST with instruction data.
 * 
 * Payload:
 * {
 *   instructionId: string
 *   title: string
 *   content: string
 *   orgId: string
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'
import { getAccessToken, getProjectId } from '../_shared/google-auth.ts'

// Configuration
const VERTEX_LOCATION = 'europe-west4'
const VERTEX_MODEL = 'text-multilingual-embedding-002'
const OPENAI_MODEL = 'text-embedding-3-small'
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
  embeddings: {
    values: number[]
  }
}

type VertexEmbeddingResponse = {
  predictions: VertexEmbeddingPrediction[]
}

type OpenAIEmbeddingData = {
  embedding: number[]
  index: number
}

type OpenAIEmbeddingResponse = {
  data: OpenAIEmbeddingData[]
}

serve(async (req: Request) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const payload: EmbeddingRequest = await req.json()
    console.log(`Processing embeddings for instruction: ${payload.instructionId}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Prepare text for embedding
    const fullText = `${payload.title}\n\n${payload.content}`.slice(0, MAX_INPUT_CHARS)
    
    // Try Vertex AI first, fallback to OpenAI
    let embeddings: number[]
    let chunkEmbeddings: number[][] = []
    
    try {
      embeddings = await generateVertexEmbedding(fullText)
      console.log('Generated embedding with Vertex AI')
    } catch (vertexError) {
      console.log('Vertex AI failed, falling back to OpenAI:', vertexError)
      embeddings = await generateOpenAIEmbedding(fullText)
      console.log('Generated embedding with OpenAI')
    }

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

      // Generate embeddings for chunks
      const chunkTexts = chunks.map(c => `${payload.title}\n\n${c.content}`.slice(0, MAX_INPUT_CHARS))
      
      try {
        chunkEmbeddings = await generateVertexEmbeddings(chunkTexts)
      } catch {
        chunkEmbeddings = await generateOpenAIEmbeddings(chunkTexts)
      }

      // Insert chunks
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
        chunksProcessed: chunks.length
      }),
      { headers, status: 200 }
    )

  } catch (error) {
    console.error('Error processing embeddings:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
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
 * Generate embeddings for multiple texts using Vertex AI
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
 * Generate embedding using OpenAI (fallback)
 */
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: text
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI error: ${error}`)
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse
  return data.data[0].embedding
}

/**
 * Generate embeddings for multiple texts using OpenAI (fallback)
 */
async function generateOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: texts
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI error: ${error}`)
  }

  const data = (await response.json()) as OpenAIEmbeddingResponse
  return data.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((entry) => entry.embedding)
}

/**
 * Split text into overlapping chunks
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
