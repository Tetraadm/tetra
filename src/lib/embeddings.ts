/**
 * Embeddings Module
 * 
 * Generates vector embeddings for semantic search using OpenAI.
 * Note: Vertex AI Embeddings was removed due to bundler compatibility issues
 * with @google-cloud/aiplatform. Can be re-added when Next.js supports it better.
 */

import OpenAI from 'openai'
import { aiLogger, createTimer } from './logger'

// Configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'
const MAX_INPUT_CHARS = 8000

// Lazy initialization
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

/**
 * Generate an embedding vector for the given text.
 * 
 * @param text - The text to generate an embedding for
 * @returns A 1536-dimensional vector representing the text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Cannot generate embedding for empty text')
  }

  const timer = createTimer(aiLogger, 'generate_embedding')
  const truncatedText = text.slice(0, MAX_INPUT_CHARS)

  try {
    const openai = getOpenAIClient()
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: truncatedText,
    })

    const embedding = response.data[0].embedding
    timer.end({ provider: 'openai', dimensions: embedding.length })
    return embedding
  } catch (error) {
    timer.fail(error, { provider: 'openai' })
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Generate embeddings for multiple texts in a single batch.
 * More efficient than calling generateEmbedding multiple times.
 * 
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of 1536-dimensional vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return []
  }

  const timer = createTimer(aiLogger, 'generate_embeddings_batch')
  const truncatedTexts = texts.map(t => (t || '').slice(0, MAX_INPUT_CHARS))

  try {
    const openai = getOpenAIClient()
    
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: truncatedTexts,
    })

    const embeddings = response.data
      .sort((a, b) => a.index - b.index)
      .map(d => d.embedding)

    timer.end({ provider: 'openai', count: texts.length, dimensions: embeddings[0]?.length })
    return embeddings
  } catch (error) {
    timer.fail(error, { provider: 'openai' })
    throw new Error(
      `Failed to generate embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
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
export function getEmbeddingProvider(): 'openai' | 'none' {
  if (process.env.OPENAI_API_KEY) return 'openai'
  return 'none'
}
