/**
 * Vertex AI Search Client
 * 
 * SECURITY NOTE (H-003): Vertex AI Search is currently DISABLED because it doesn't
 * respect organization boundaries. The Data Store contains documents from all orgs,
 * and filtering by orgId is not implemented in Discovery Engine.
 * 
 * The embedding search (via Supabase) respects RLS and is used instead.
 * 
 * To re-enable Vertex AI Search:
 * 1. Implement org filtering in the Edge Function (filter by GCS path prefix)
 * 2. Or create separate Data Stores per org
 * 3. Set ENABLE_VERTEX_SEARCH=true in environment
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
 * NOTE: Currently disabled for security (H-003). Returns empty results.
 * The embedding search in /api/ask handles search instead.
 */
export async function searchDocuments(
    query: string, 
    limit: number = 5,
    orgId?: string
): Promise<VertexSearchResult[]> {
    const timer = createTimer(aiLogger, 'vertex_search')
    
    // SECURITY: Vertex Search disabled until org filtering is implemented
    if (!ENABLE_VERTEX_SEARCH) {
        aiLogger.debug({ query }, 'Vertex Search disabled (H-003 security), using embedding search instead')
        timer.end({ source: 'disabled', reason: 'security_h003' })
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
 * NOTE: Currently disabled for security (H-003). Returns empty results.
 */
export async function searchWithAnswer(
    query: string,
    limit: number = 5,
    orgId?: string
): Promise<{ results: VertexSearchResult[]; answer?: string; citations?: Array<{ title: string; uri: string }> }> {
    const timer = createTimer(aiLogger, 'vertex_search_with_answer')

    // SECURITY: Vertex Search disabled until org filtering is implemented
    if (!ENABLE_VERTEX_SEARCH) {
        timer.end({ source: 'disabled', reason: 'security_h003' })
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
