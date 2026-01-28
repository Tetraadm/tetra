/**
 * Vertex AI Search Client
 * 
 * Calls the vertex-search Edge Function to perform semantic search.
 * This avoids using the Google Cloud SDK which doesn't work with Turbopack.
 */

import { getCachedSearchResults, cacheSearchResults } from './cache'
import { aiLogger, createTimer } from './logger'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const ENABLE_SEARCH_CACHE = process.env.ENABLE_SEARCH_CACHE !== 'false' // Default enabled

export type VertexSearchResult = {
    id: string
    title: string
    content: string
    link?: string
    score: number
}

type EdgeFunctionResponse = {
    results: VertexSearchResult[]
    answer?: string
    citations?: Array<{ title: string; uri: string }>
    error?: string
}

/**
 * Search documents using Vertex AI Search via Edge Function
 */
export async function searchDocuments(
    query: string, 
    limit: number = 5,
    orgId?: string
): Promise<VertexSearchResult[]> {
    const timer = createTimer(aiLogger, 'vertex_search')
    
    // Check cache first
    if (ENABLE_SEARCH_CACHE) {
        const cached = await getCachedSearchResults<VertexSearchResult[]>(query, orgId)
        if (cached) {
            timer.end({ source: 'cache', count: cached.length })
            return cached
        }
    }

    // Validate configuration
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        aiLogger.warn('Supabase not configured for Vertex Search Edge Function')
        timer.end({ source: 'skipped', reason: 'not_configured' })
        return []
    }

    try {
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/vertex-search`
        
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                query,
                limit,
                orgId,
                includeAnswer: false // We generate answers with Gemini separately
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            aiLogger.error({ status: response.status, error: errorText }, 'Vertex Search Edge Function error')
            timer.fail(new Error(errorText), { query })
            return []
        }

        const data: EdgeFunctionResponse = await response.json()

        if (data.error) {
            aiLogger.error({ error: data.error }, 'Vertex Search returned error')
            timer.fail(new Error(data.error), { query })
            return []
        }

        const results = data.results || []

        if (process.env.NODE_ENV === 'development') {
            aiLogger.debug({
                query,
                resultsCount: results.length,
                firstResultTitle: results[0]?.title
            }, 'Vertex search completed via Edge Function')
        }

        // Cache results
        if (ENABLE_SEARCH_CACHE && results.length > 0) {
            await cacheSearchResults(query, results, orgId)
        }

        timer.end({ source: 'edge_function', count: results.length })
        return results

    } catch (error) {
        aiLogger.error({ error }, 'Vertex Search Edge Function call failed')
        timer.fail(error, { query })
        return []
    }
}

/**
 * Search documents with grounded answer generation
 * This uses Vertex AI Search's built-in summarization with citations
 */
export async function searchWithAnswer(
    query: string,
    limit: number = 5,
    orgId?: string
): Promise<{ results: VertexSearchResult[]; answer?: string; citations?: Array<{ title: string; uri: string }> }> {
    const timer = createTimer(aiLogger, 'vertex_search_with_answer')

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        aiLogger.warn('Supabase not configured for Vertex Search Edge Function')
        timer.end({ source: 'skipped', reason: 'not_configured' })
        return { results: [] }
    }

    try {
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/vertex-search`
        
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({
                query,
                limit,
                orgId,
                includeAnswer: true // Enable grounded answer generation
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            aiLogger.error({ status: response.status, error: errorText }, 'Vertex Search with answer failed')
            timer.fail(new Error(errorText), { query })
            return { results: [] }
        }

        const data: EdgeFunctionResponse = await response.json()

        if (data.error) {
            aiLogger.error({ error: data.error }, 'Vertex Search with answer returned error')
            timer.fail(new Error(data.error), { query })
            return { results: [] }
        }

        timer.end({ 
            source: 'edge_function', 
            count: data.results?.length || 0,
            hasAnswer: !!data.answer 
        })

        return {
            results: data.results || [],
            answer: data.answer,
            citations: data.citations
        }

    } catch (error) {
        aiLogger.error({ error }, 'Vertex Search with answer call failed')
        timer.fail(error, { query })
        return { results: [] }
    }
}
