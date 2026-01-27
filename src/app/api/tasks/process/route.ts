/**
 * Cloud Tasks Handler
 * POST /api/tasks/process
 * 
 * Processes async tasks from Cloud Tasks queue.
 * This endpoint should only be called by Cloud Tasks or internal services.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for heavy processing

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { generateEmbedding, generateEmbeddings, prepareTextForEmbedding } from '@/lib/embeddings'
import { chunkText, prepareChunksForEmbedding } from '@/lib/chunking'
import { verifyCloudTasksRequest, type TaskPayload } from '@/lib/cloud-tasks'
import { apiLogger, createTimer, logError } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const timer = createTimer(apiLogger, 'process_task')
  
  // Verify the request is from Cloud Tasks or authorized
  if (!verifyCloudTasksRequest(request.headers)) {
    apiLogger.warn('Unauthorized task request rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload: TaskPayload = await request.json()
    
    apiLogger.info({ 
      type: payload.type, 
      instructionId: payload.instructionId 
    }, 'Processing task')

    const adminClient = createServiceRoleClient()

    switch (payload.type) {
      case 'generate_embeddings':
        await processEmbeddings(adminClient, payload)
        break
      
      case 'reindex_instruction':
        await reindexInstruction(adminClient, payload)
        break
      
      case 'process_document':
        await processDocument(adminClient, payload)
        break
      
      default:
        apiLogger.warn({ type: payload.type }, 'Unknown task type')
        return NextResponse.json({ error: 'Unknown task type' }, { status: 400 })
    }

    timer.end({ type: payload.type, instructionId: payload.instructionId })
    return NextResponse.json({ success: true })

  } catch (error) {
    logError(apiLogger, error, { operation: 'process_task' })
    timer.fail(error, {})
    
    // Return 500 so Cloud Tasks will retry
    return NextResponse.json(
      { error: 'Task processing failed' }, 
      { status: 500 }
    )
  }
}

/**
 * Generate embeddings for an instruction
 */
async function processEmbeddings(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  payload: TaskPayload
) {
  const { instructionId, title, content } = payload
  
  if (!content || !title) {
    // Fetch from database if not provided
    const { data: instruction, error } = await adminClient
      .from('instructions')
      .select('title, content')
      .eq('id', instructionId)
      .single()
    
    if (error || !instruction) {
      throw new Error(`Instruction not found: ${instructionId}`)
    }
    
    payload.title = instruction.title
    payload.content = instruction.content || ''
  }

  const effectiveTitle = payload.title!
  const effectiveContent = payload.content || ''

  // Generate full document embedding
  const textForEmbedding = prepareTextForEmbedding(effectiveTitle, effectiveContent)
  const fullEmbedding = await generateEmbedding(textForEmbedding)

  // Update instruction with embedding
  const { error: embeddingError } = await adminClient
    .from('instructions')
    .update({ embedding: JSON.stringify(fullEmbedding) })
    .eq('id', instructionId)

  if (embeddingError) {
    throw new Error(`Failed to store embedding: ${embeddingError.message}`)
  }

  // Generate chunks with embeddings
  if (effectiveContent.trim().length > 0) {
    // Delete existing chunks first
    await adminClient
      .from('instruction_chunks')
      .delete()
      .eq('instruction_id', instructionId)

    const chunks = chunkText(effectiveContent)
    
    if (chunks.length > 0) {
      const chunkTexts = prepareChunksForEmbedding(effectiveTitle, chunks)
      const chunkEmbeddings = await generateEmbeddings(chunkTexts)

      const chunkInserts = chunks.map((chunk, idx) => ({
        instruction_id: instructionId,
        chunk_index: chunk.index,
        content: chunk.content,
        embedding: JSON.stringify(chunkEmbeddings[idx])
      }))

      const { error: chunksError } = await adminClient
        .from('instruction_chunks')
        .insert(chunkInserts)

      if (chunksError) {
        apiLogger.error({ error: chunksError }, 'Failed to insert chunks')
      }
    }
  }

  apiLogger.info({ instructionId }, 'Embeddings generated successfully')
}

/**
 * Reindex an instruction (delete and regenerate all embeddings)
 */
async function reindexInstruction(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  payload: TaskPayload
) {
  // Just call processEmbeddings - it handles deletion
  await processEmbeddings(adminClient, payload)
}

/**
 * Process a newly uploaded document
 */
async function processDocument(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  payload: TaskPayload
) {
  // For now, same as processEmbeddings
  // In the future, this could include:
  // - Document AI processing
  // - Keyword extraction
  // - Content analysis
  await processEmbeddings(adminClient, payload)
}
