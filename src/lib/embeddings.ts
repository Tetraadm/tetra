/**
 * OpenAI Embeddings Module
 * 
 * Generates vector embeddings for semantic search using OpenAI's text-embedding-3-small model.
 * These embeddings are 1536-dimensional vectors that represent the semantic meaning of text.
 */

import OpenAI from 'openai'

// Lazy initialization to avoid errors when API key is not set
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

// Model configuration
const EMBEDDING_MODEL = 'text-embedding-3-small'
const MAX_INPUT_CHARS = 8000 // Model limit is ~8191 tokens, ~8000 chars is safe

/**
 * Generate an embedding vector for the given text.
 * The embedding represents the semantic meaning of the text.
 * 
 * @param text - The text to generate an embedding for
 * @returns A 1536-dimensional vector representing the text
 * @throws Error if OPENAI_API_KEY is not set or API call fails
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
        throw new Error('Cannot generate embedding for empty text')
    }

    const openai = getOpenAIClient()

    // Truncate text if too long
    const truncatedText = text.slice(0, MAX_INPUT_CHARS)

    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: truncatedText,
        })

        return response.data[0].embedding
    } catch (error) {
        console.error('EMBEDDING_ERROR:', error)
        throw new Error(
            `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
        )
    }
}

/**
 * Generate embeddings for multiple texts in a single API call.
 * More efficient than calling generateEmbedding multiple times.
 * 
 * @param texts - Array of texts to generate embeddings for
 * @returns Array of 1536-dimensional vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
        return []
    }

    const openai = getOpenAIClient()

    // Truncate each text
    const truncatedTexts = texts.map(t => (t || '').slice(0, MAX_INPUT_CHARS))

    try {
        const response = await openai.embeddings.create({
            model: EMBEDDING_MODEL,
            input: truncatedTexts,
        })

        // Sort by index to maintain order
        return response.data
            .sort((a, b) => a.index - b.index)
            .map(d => d.embedding)
    } catch (error) {
        console.error('BATCH_EMBEDDING_ERROR:', error)
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
