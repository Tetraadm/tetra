/**
 * Cloud Tasks Stub Module
 * 
 * NOTE: Full Cloud Tasks implementation was removed due to bundler 
 * compatibility issues with @google-cloud/tasks in Next.js.
 * 
 * This stub provides the same interface but always falls back to
 * synchronous processing. Cloud Tasks can be re-enabled when
 * Next.js/Turbopack better supports Google Cloud packages.
 * 
 * For async processing, consider using:
 * - Vercel Background Functions
 * - A separate Cloud Run service
 * - Supabase Edge Functions
 */

import { aiLogger } from './logger'

export type TaskPayload = {
  type: 'generate_embeddings' | 'process_document' | 'reindex_instruction'
  instructionId: string
  orgId: string
  title?: string
  content?: string
  priority?: 'high' | 'normal' | 'low'
}

/**
 * Create a Cloud Task for async processing
 * NOTE: Currently always returns sync mode due to bundler issues
 */
export async function createTask(payload: TaskPayload): Promise<{ taskId: string | null; async: boolean }> {
  aiLogger.debug({ type: payload.type }, 'Cloud Tasks disabled, using sync processing')
  return { taskId: null, async: false }
}

/**
 * Check if Cloud Tasks is properly configured
 * NOTE: Currently always returns false due to bundler issues
 */
export function isCloudTasksConfigured(): boolean {
  return false
}

/**
 * Verify that a request is from Cloud Tasks
 */
export function verifyCloudTasksRequest(headers: Headers): boolean {
  // In development, allow with secret
  if (process.env.NODE_ENV === 'development') {
    const devSecret = headers.get('x-task-secret')
    if (devSecret === process.env.CLOUD_TASKS_DEV_SECRET) {
      return true
    }
  }
  
  // Check for Cloud Tasks headers
  const taskName = headers.get('x-cloudtasks-taskname')
  const queueName = headers.get('x-cloudtasks-queuename')
  
  return !!(taskName && queueName)
}
