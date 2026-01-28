/**
 * Supabase Edge Functions Client
 * 
 * Helper functions for calling Supabase Edge Functions from Next.js.
 * Used for async processing of embeddings and document extraction.
 */

import { aiLogger, createTimer, logError } from './logger'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EDGE_FUNCTION_SECRET = process.env.EDGE_FUNCTION_SECRET // Shared secret for internal calls

interface EdgeFunctionResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Call a Supabase Edge Function
 */
async function callEdgeFunction<T>(
  functionName: string,
  payload: Record<string, unknown>
): Promise<EdgeFunctionResponse<T>> {
  const timer = createTimer(aiLogger, `edge_function_${functionName}`)
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    aiLogger.warn('Supabase not configured for Edge Functions')
    timer.end({ success: false, reason: 'not_configured' })
    return { success: false, error: 'Edge Functions not configured' }
  }

  const url = `${SUPABASE_URL}/functions/v1/${functionName}`
  
  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    }
    
    // Add shared secret for internal authentication
    if (EDGE_FUNCTION_SECRET) {
      headers['X-Edge-Secret'] = EDGE_FUNCTION_SECRET
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json() as T
    timer.end({ success: true, functionName })
    
    return { success: true, data }
  } catch (error) {
    logError(aiLogger, error, { functionName, payload })
    timer.fail(error, { functionName })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Trigger embedding generation for an instruction
 */
export async function triggerEmbeddingGeneration(params: {
  instructionId: string
  title: string
  content: string
  orgId: string
}): Promise<boolean> {
  const result = await callEdgeFunction('generate-embeddings', params)
  
  if (!result.success) {
    aiLogger.warn({ instructionId: params.instructionId, error: result.error }, 
      'Failed to trigger embedding generation')
  }
  
  return result.success
}

/**
 * Trigger document processing with Document AI
 */
export async function triggerDocumentProcessing(params: {
  instructionId: string
  filePath: string
  orgId: string
  triggerEmbeddings?: boolean
}): Promise<boolean> {
  const result = await callEdgeFunction('process-document', params)
  
  if (!result.success) {
    aiLogger.warn({ instructionId: params.instructionId, error: result.error }, 
      'Failed to trigger document processing')
  }
  
  return result.success
}

/**
 * Check if Edge Functions are available
 */
export function isEdgeFunctionsConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_SERVICE_KEY
}
