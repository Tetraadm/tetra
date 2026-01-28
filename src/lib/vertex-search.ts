/**
 * Vertex AI Search Client
 *
 * H-01 Security: Vertex AI Search now supports org isolation via structData.orgId
 * filtering. Documents are exported with orgId metadata and filtered at query time.
 *
 * Prerequisites before enabling:
 * 1. Run vertex-export with action=export-all to export instructions with metadata
 * 2. Run vertex-admin with action=import-jsonl to import JSONL into Discovery Engine
 * 3. Verify org isolation works correctly in test environment
 * 4. Set ENABLE_VERTEX_SEARCH=true in environment
 *
 * The orgId parameter is now REQUIRED for all search calls.
 */

import { getCachedSearchResults, cacheSearchResults } from './cache'
import { aiLogger, createTimer } from './logger'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const EDGE_FUNCTION_SECRET = process.env.EDGE_FUNCTION_SECRET
const ENABLE_SEARCH_CACHE = process.env.ENABLE_SEARCH_CACHE !== 'false'

// SECURITY: Disabled by default until org filtering is implemented
const ENABLE_VERTEX_SEARCH = process.env.ENABLE_VERTEX_SEARCH === 'true'

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
 * Get headers for Edge Function calls
 */
function getEdgeFunctionHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY || ''
    }
    
    if (EDGE_FUNCTION_SECRET) {
        headers['X-Edge-Secret'] = EDGE_FUNCTION_SECRET
    }
    
    return headers
}

/**
 * Search documents using Vertex AI Search via Edge Function
 *
 * Requires orgId parameter to ensure org isolation (H-01 security).
 * Returns empty results if ENABLE_VERTEX_SEARCH is not set to 'true'.
 */
export async function searchDocuments(
    query: string,
    limit: number = 5,
    orgId: string
): Promise<VertexSearchResult[]> {
    const timer = createTimer(aiLogger, 'vertex_search')

    if (!orgId) {
        aiLogger.warn({ query }, 'Vertex Search called without orgId, returning empty results')
        timer.end({ source: 'error', reason: 'missing_orgId' })
        return []
    }

    // Vertex Search disabled until org filtering is verified in production
    if (!ENABLE_VERTEX_SEARCH) {
        aiLogger.debug({ query, orgId }, 'Vertex Search disabled, using embedding search instead')
        timer.end({ source: 'disabled', reason: 'not_enabled' })
        return []
    }
    
    // Check cache first
    if (ENABLE_SEARCH_CACHE) {
        const cached = await getCachedSearchResults<VertexSearchResult[]>(query, orgId)
        if (cached) {
            timer.end({ source: 'cache', count: cached.length })
            return cached
        }
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        aiLogger.warn('Supabase not configured for Vertex Search Edge Function')
        timer.end({ source: 'skipped', reason: 'not_configured' })
        return []
    }

    try {
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/vertex-search`
        
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: getEdgeFunctionHeaders(),
            body: JSON.stringify({
                query,
                limit,
                orgId,
                includeAnswer: false
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
 *
 * Requires orgId parameter to ensure org isolation (H-01 security).
 * Returns empty results if ENABLE_VERTEX_SEARCH is not set to 'true'.
 */
export async function searchWithAnswer(
    query: string,
    limit: number = 5,
    orgId: string
): Promise<{ results: VertexSearchResult[]; answer?: string; citations?: Array<{ title: string; uri: string }> }> {
    const timer = createTimer(aiLogger, 'vertex_search_with_answer')

    if (!orgId) {
        aiLogger.warn({ query }, 'Vertex Search with answer called without orgId, returning empty results')
        timer.end({ source: 'error', reason: 'missing_orgId' })
        return { results: [] }
    }

    // Vertex Search disabled until org filtering is verified in production
    if (!ENABLE_VERTEX_SEARCH) {
        timer.end({ source: 'disabled', reason: 'not_enabled' })
        return { results: [] }
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        aiLogger.warn('Supabase not configured for Vertex Search Edge Function')
        timer.end({ source: 'skipped', reason: 'not_configured' })
        return { results: [] }
    }

    try {
        const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/vertex-search`
        
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: getEdgeFunctionHeaders(),
            body: JSON.stringify({
                query,
                limit,
                orgId,
                includeAnswer: true
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
