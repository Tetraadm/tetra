import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiRatelimit, getClientIp } from '@/lib/ratelimit'
import { z } from 'zod'
import { generateEmbedding } from '@/lib/embeddings'
import {
  calculateRelevanceScore,
  extractKeywords,
  type InstructionWithKeywords
} from '@/lib/keyword-extraction'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const FALLBACK_ANSWER = 'Jeg finner ingen relevant instruks i Tetrivo for dette. Kontakt din leder eller sikkerhetsansvarlig.'
const RAW_MIN_SCORE = Number(process.env.AI_MIN_RELEVANCE_SCORE ?? '0.35')
const MIN_SCORE = Number.isFinite(RAW_MIN_SCORE) ? RAW_MIN_SCORE : 0.35
const VECTOR_SEARCH_THRESHOLD = 0.25 // Minimum similarity for vector search (lowered for short queries)

const askSchema = z.object({
  question: z.string().min(1).max(1000),
  orgId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  stream: z.boolean().optional().default(false), // NEW: Enable streaming
})

// Type for vector search results
type VectorSearchResult = {
  id: string
  title: string
  content: string
  severity: string
  folder_id: string | null
  updated_at: string | null
  similarity: number
}

function normalizeKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string')
      }
    } catch {
      return []
    }
  }

  return []
}

function getFolderNameFromInstruction(
  inst: Record<string, unknown>
): string {
  if (!('folders' in inst)) {
    return ''
  }

  const foldersData = inst.folders as unknown
  const folderObj = Array.isArray(foldersData) ? foldersData[0] : foldersData
  if (folderObj && typeof folderObj === 'object' && 'name' in folderObj) {
    return '[' + (folderObj as { name: string }).name + '] '
  }

  return ''
}

function getSeverityFromInstruction(
  inst: Record<string, unknown>
): string {
  if (!('severity' in inst)) {
    return ''
  }

  return typeof inst.severity === 'string' ? inst.severity : ''
}

function countKeywordOverlap(
  queryKeywords: string[],
  instruction: InstructionWithKeywords
): number {
  const title = instruction.title?.toLowerCase() ?? ''
  const content = instruction.content?.toLowerCase() ?? ''
  const instructionKeywords = Array.isArray(instruction.keywords)
    ? instruction.keywords.filter((keyword): keyword is string => typeof keyword === 'string')
    : []
  const keywordSet = new Set(instructionKeywords)
  const combined = `${title} ${content}`

  return queryKeywords.reduce((count, keyword) => {
    if (keywordSet.has(keyword) || combined.includes(keyword)) {
      return count + 1
    }
    return count
  }, 0)
}

/**
 * Try vector search first, fall back to keyword search if embeddings not available
 */
async function findRelevantInstructions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  question: string,
  userId: string
): Promise<{
  instructions: Array<VectorSearchResult | InstructionWithKeywords>
  usedVectorSearch: boolean
}> {
  // Try hybrid search first (vector + full-text) if OpenAI is configured
  if (process.env.OPENAI_API_KEY) {
    try {
      const questionEmbedding = await generateEmbedding(question)

      // Call the hybrid search function (vector + FTS with RRF)
      // Format embedding as PostgreSQL vector: [x,y,z] (not JSON string)
      const embeddingStr = `[${questionEmbedding.join(',')}]`

      const { data: hybridResults, error: hybridError } = await supabase
        .rpc('match_chunks_hybrid', {
          query_embedding: embeddingStr,
          query_text: question,
          match_count: 10,
          p_user_id: userId
        })

      console.log('[ASK] Hybrid search result:', {
        hasError: !!hybridError,
        errorMsg: hybridError?.message,
        resultCount: hybridResults?.length ?? 0
      })

      if (!hybridError && hybridResults && hybridResults.length > 0) {
        // Map to VectorSearchResult format
        const results = hybridResults.map((r: { instruction_id: string; title: string; content: string; severity: string; folder_id: string | null; updated_at: string | null; combined_score: number }) => ({
          id: r.instruction_id,
          title: r.title,
          content: r.content,
          severity: r.severity,
          folder_id: r.folder_id,
          updated_at: r.updated_at,
          similarity: r.combined_score
        }))
        return {
          instructions: results as VectorSearchResult[],
          usedVectorSearch: true // Indicates hybrid was used
        }
      }

      // Fallback to legacy match_instructions if no chunks exist yet
      if (hybridError?.message?.includes('instruction_chunks') || hybridResults?.length === 0) {
        console.log('[ASK] Falling back to legacy match_instructions')
        const { data: vectorResults, error: vectorError } = await supabase
          .rpc('match_instructions', {
            query_embedding: embeddingStr,
            match_threshold: VECTOR_SEARCH_THRESHOLD,
            match_count: 10,
            p_user_id: userId
          })

        if (!vectorError && vectorResults && vectorResults.length > 0) {
          return {
            instructions: vectorResults as VectorSearchResult[],
            usedVectorSearch: true
          }
        }
      }

      if (hybridError) {
        console.warn('[ASK] Hybrid search failed:', hybridError.message)
      }
    } catch (embeddingError) {
      console.warn('[ASK] Embedding generation failed, falling back to keyword search:', embeddingError)
    }
  }

  // Fallback to keyword search
  const { data, error } = await supabase
    .rpc('get_user_instructions', { p_user_id: userId })

  if (error) {
    throw new Error(`Failed to fetch instructions: ${error.message}`)
  }

  const allInstructions = (data || []) as InstructionWithKeywords[]
  const normalizedInstructions = allInstructions.map(inst => ({
    ...inst,
    keywords: normalizeKeywords(inst.keywords)
  }))

  const instructionsWithContent = normalizedInstructions.filter(i => i.content && i.content.trim())
  const queryKeywords = extractKeywords(question, 5)

  if (instructionsWithContent.length === 0 || queryKeywords.length === 0) {
    return { instructions: [], usedVectorSearch: false }
  }

  const scoredInstructions = instructionsWithContent.map(instruction => {
    const score = calculateRelevanceScore(
      queryKeywords,
      instruction.keywords || [],
      instruction.title
    )
    const overlapCount = countKeywordOverlap(queryKeywords, instruction)
    return { instruction, score, overlapCount }
  })

  const relevantInstructions = scoredInstructions
    .filter(item => item.score >= MIN_SCORE && item.overlapCount > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(item => item.instruction)

  return { instructions: relevantInstructions, usedVectorSearch: false }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = askSchema.safeParse(body)

    if (!validation.success) {
      return Response.json({ error: 'Ugyldig input' }, { status: 400 })
    }

    const { question, orgId: clientOrgId, userId: clientUserId, stream } = validation.data

    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const ip = getClientIp(request)
    const rateLimitKey = `user:${user.id}`
    const { success, limit, remaining, reset, isMisconfigured } = await aiRatelimit.limit(rateLimitKey)

    if (isMisconfigured) {
      console.error('ASK_FATAL: Rate limiter misconfigured')
      return Response.json(
        { error: 'Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.' },
        { status: 503 }
      )
    }

    if (!success) {
      return Response.json(
        { error: 'For mange forespørsler. Prøv igjen om litt.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        }
      )
    }

    void ip

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('ASK_FATAL: profile fetch failed', profileError)
      return Response.json({ error: 'Profil ikke funnet' }, { status: 403 })
    }

    if (clientOrgId && clientOrgId !== profile.org_id) {
      return Response.json({ error: 'Ingen tilgang' }, { status: 403 })
    }
    if (clientUserId && clientUserId !== user.id) {
      return Response.json({ error: 'Ingen tilgang' }, { status: 403 })
    }

    const orgId = profile.org_id
    const userId = user.id

    // Find relevant instructions using vector search or keyword fallback
    const { instructions: relevantInstructions, usedVectorSearch } = await findRelevantInstructions(
      supabase,
      question,
      userId
    )

    if (relevantInstructions.length === 0) {
      await logUnansweredQuestion(supabase, orgId, userId, question)
      return Response.json({ answer: FALLBACK_ANSWER, source: null })
    }

    // Build context from instructions
    const context = relevantInstructions.map(inst => {
      const folderName = getFolderNameFromInstruction(inst)
      const severity = getSeverityFromInstruction(inst)
      return '---\nDOKUMENT: ' + folderName + inst.title + '\nALVORLIGHET: ' + severity + '\nINNHOLD:\n' + inst.content + '\n---'
    }).join('\n\n')

    const systemPrompt = `Du er Tetrivo, en intern HMS-assistent for en bedrift.

KRITISKE REGLER:
1. Du skal KUN sitere og gjengi informasjon fra DOKUMENTENE nedenfor.
2. Du har IKKE lov til å bruke ekstern kunnskap, egne vurderinger eller anbefalinger.
3. Du skal ALDRI legge til kommentarer som "Merk:", "Dette høres ut...", "Jeg anbefaler..." eller lignende.
4. Du skal ALDRI dikte opp prosedyrer eller gi egne råd.
5. Hvis svaret IKKE finnes i dokumentene nedenfor, svar NØYAKTIG: "Jeg finner ingen relevant instruks i Tetrivo for dette. Kontakt din leder eller sikkerhetsansvarlig."
6. Referer alltid til hvilket dokument svaret kommer fra ved å si "Basert på dokumentet [tittel]:" først.
7. Svar kort, faktabasert og kun med det som faktisk står i dokumentet.
8. Selv om innholdet virker rart eller uprofesjonelt, skal du BARE gjengi det uten å kommentere.
9. Du har KUN tilgang til dokumentene listet nedenfor. PDF-filer uten tekstutskrift er IKKE tilgjengelig for deg.

TILGJENGELIGE DOKUMENTER:
${context}`

    const sourceInstruction = relevantInstructions[0]
    const sourceData = {
      instruction_id: sourceInstruction.id,
      title: sourceInstruction.title,
      updated_at: 'updated_at' in sourceInstruction ? sourceInstruction.updated_at ?? null : null,
      open_url_or_route: `/employee?instruction=${sourceInstruction.id}`
    }

    // STREAMING MODE
    if (stream) {
      const encoder = new TextEncoder()

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            const streamResponse = anthropic.messages.stream({
              model: 'claude-3-5-haiku-20241022',
              max_tokens: 500,
              temperature: 0,
              system: systemPrompt,
              messages: [{ role: 'user', content: question }]
            })

            streamResponse.on('text', (text) => {
              // Send text chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`))
            })

            await streamResponse.finalMessage()

            // Send source metadata at the end
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'source', content: sourceData })}\n\n`))
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))

            // Question was answered - no logging needed
            controller.close()
          } catch (error) {
            console.error('STREAM_ERROR:', error)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', content: 'Streaming feilet' })}\n\n`))
            controller.close()
          }
        }
      })

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Search-Method': usedVectorSearch ? 'vector' : 'keyword'
        }
      })
    }

    // NON-STREAMING MODE (backward compatible)
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }]
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text : 'Kunne ikke generere svar.'

    // Question was answered - no logging needed

    return Response.json({
      answer,
      source: sourceData,
      searchMethod: usedVectorSearch ? 'vector' : 'keyword'
    })

  } catch (error) {
    console.error('ASK_FATAL:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({
      error: process.env.NODE_ENV === 'production'
        ? 'Kunne ikke behandle spørsmålet'
        : `Feil: ${message}`
    }, { status: 500 })
  }
}

async function logUnansweredQuestion(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  userId: string,
  question: string
) {
  try {
    const { error } = await supabase.from('ai_unanswered_questions').insert({
      org_id: orgId,
      user_id: userId,
      question
    })
    if (error) console.error('ASK_LOG_ERROR: ai_unanswered_questions insert', error)
  } catch (err) {
    console.error('ASK_LOG_ERROR:', err)
  }
}
