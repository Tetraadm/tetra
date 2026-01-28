import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'
import { aiRatelimit, getClientIp } from '@/lib/ratelimit'
import { z } from 'zod'
import { generateEmbedding } from '@/lib/embeddings'
import { searchDocuments, type VertexSearchResult } from '@/lib/vertex-search'
import { streamGeminiAnswer, generateGeminiAnswer } from '@/lib/vertex-chat'
import {
  calculateRelevanceScore,
  extractKeywords,
  type InstructionWithKeywords
} from '@/lib/keyword-extraction'
import { maskPII } from '@/lib/pii'

const FALLBACK_ANSWER = 'Finner ingen instrukser knyttet til dette i Tetrivo. Kontakt din nærmeste leder.'
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

type InstructionLike = {
  title?: string | null
  content?: string | null
  keywords?: unknown
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
  instruction: InstructionLike
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
 * Smart re-ranking of search results based on multiple signals:
 * 1. Title match (strongest signal - exact or partial match)
 * 2. Severity (critical > medium > low)
 * 3. Recency (recently updated instructions get a boost)
 */
function smartRerank<T extends { 
  title: string
  severity?: string
  updated_at?: string | null
  similarity?: number 
}>(
  results: T[],
  query: string
): T[] {
  const queryLower = query.toLowerCase().trim()
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)
  
  const scored = results.map(result => {
    let score = result.similarity || 0.5
    const titleLower = (result.title || '').toLowerCase()
    
    // 1. Title match boost (strongest signal)
    if (titleLower === queryLower) {
      // Exact title match - huge boost
      score += 0.5
    } else if (titleLower.includes(queryLower) || queryLower.includes(titleLower)) {
      // Partial title match - significant boost
      score += 0.3
    } else {
      // Check if query words appear in title
      const titleMatchCount = queryWords.filter(w => titleLower.includes(w)).length
      if (titleMatchCount > 0) {
        score += 0.15 * (titleMatchCount / queryWords.length)
      }
    }
    
    // 2. Severity boost (critical instructions are more important)
    const severity = result.severity?.toLowerCase() || 'medium'
    if (severity === 'critical') {
      score += 0.1
    } else if (severity === 'low') {
      score -= 0.05
    }
    
    // 3. Recency boost (updated in last 30 days)
    if (result.updated_at) {
      const updatedAt = new Date(result.updated_at)
      const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceUpdate < 30) {
        score += 0.05
      } else if (daysSinceUpdate > 365) {
        score -= 0.02 // Slight penalty for old instructions
      }
    }
    
    return { result, score }
  })
  
  // Sort by smart score descending
  scored.sort((a, b) => b.score - a.score)
  
  // Log for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[RERANK] Top 3 results:', scored.slice(0, 3).map(s => ({
      title: s.result.title,
      originalScore: s.result.similarity,
      smartScore: s.score.toFixed(3)
    })))
  }
  
  return scored.map(s => s.result)
}

function filterByKeywordOverlap<T extends InstructionLike>(
  queryKeywords: string[],
  instructions: T[]
): T[] {
  if (queryKeywords.length === 0) {
    return []
  }

  return instructions.filter(instruction => countKeywordOverlap(queryKeywords, instruction) > 0)
}

/**
 * Try vector search first, fall back to keyword search if embeddings not available
 */
async function findRelevantInstructions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  question: string,
  userId: string,
  orgId: string
): Promise<{
  instructions: Array<VectorSearchResult | InstructionWithKeywords>
  usedVectorSearch: boolean
}> {
  // 1. Try Vertex AI Search first (The new primary search)
  try {
    const vertexResults = await searchDocuments(question, 5, orgId)
    console.log('[ASK_DEBUG] vertexResults length:', vertexResults.length)
    if (vertexResults.length > 0) {
      // Extract file paths and UUIDs from Vertex results to match with database
      // Link format: gs://bucket/orgId/uuid.pdf or just orgId/uuid.pdf
      // Title might be: "uuid.pdf" or "orgId/uuid.pdf" or a readable title
      const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
      
      const extractedData = vertexResults.map((r: VertexSearchResult) => {
        const link = r.link || ''
        
        // Try to extract file path from GCS link
        const gcsMatch = link.match(/gs:\/\/[^/]+\/(.+)$/)
        if (gcsMatch) return { type: 'path', value: gcsMatch[1] }
        
        // Try to extract from title if it looks like a file path
        if (r.title && r.title.includes('/')) return { type: 'path', value: r.title }
        
        // Try to extract UUID from title (e.g., "2cdfa043-e368-4cbd-9b9a-b798be54ae51.pdf")
        const uuidMatch = r.title?.match(uuidRegex)
        if (uuidMatch) return { type: 'uuid', value: uuidMatch[1] }
        
        return null
      })
      
      const filePaths = extractedData
        .filter(d => d?.type === 'path')
        .map(d => d!.value)
      
      const uuids = extractedData
        .filter(d => d?.type === 'uuid')
        .map(d => d!.value)
      
      console.log('[ASK_DEBUG] Extracted file paths:', filePaths)
      console.log('[ASK_DEBUG] Extracted UUIDs:', uuids)
      
      // Lookup instructions by file_path or id to get correct id and title
      let enrichedInstructions: VectorSearchResult[] = []
      
      if (filePaths.length > 0 || uuids.length > 0) {
        // Try to find instructions by file_path first
        let dbInstructions: Array<{
          id: string
          title: string
          content: string | null
          severity: string
          folder_id: string | null
          updated_at: string | null
          file_path: string | null
        }> = []
        
        if (filePaths.length > 0) {
          const { data: pathResults, error: pathError } = await supabase
            .from('instructions')
            .select('id, title, content, severity, folder_id, updated_at, file_path')
            .in('file_path', filePaths)
          
          if (!pathError && pathResults) {
            dbInstructions = pathResults
          }
        }
        
        // Also try to find by UUID if we have any
        if (uuids.length > 0) {
          const { data: uuidResults, error: uuidError } = await supabase
            .from('instructions')
            .select('id, title, content, severity, folder_id, updated_at, file_path')
            .in('id', uuids)
          
          if (!uuidError && uuidResults) {
            // Merge results, avoiding duplicates
            const existingIds = new Set(dbInstructions.map(i => i.id))
            for (const inst of uuidResults) {
              if (!existingIds.has(inst.id)) {
                dbInstructions.push(inst)
              }
            }
          }
        }
        
        if (dbInstructions.length > 0) {
          // Create maps for quick lookup
          const instructionByPath = new Map(
            dbInstructions.filter(i => i.file_path).map(inst => [inst.file_path, inst])
          )
          const instructionById = new Map(
            dbInstructions.map(inst => [inst.id, inst])
          )
          
          // Enrich Vertex results with database data
          enrichedInstructions = vertexResults.map((r: VertexSearchResult) => {
            const link = r.link || ''
            const gcsMatch = link.match(/gs:\/\/[^/]+\/(.+)$/)
            const filePath = gcsMatch ? gcsMatch[1] : (r.title && r.title.includes('/') ? r.title : null)
            const uuidMatch = r.title?.match(uuidRegex)
            const uuid = uuidMatch ? uuidMatch[1] : null
            
            // Try to match by file_path first, then by UUID
            let dbInst = filePath ? instructionByPath.get(filePath) : null
            if (!dbInst && uuid) {
              dbInst = instructionById.get(uuid)
            }
            
            if (dbInst) {
              console.log('[ASK_DEBUG] Matched Vertex result to DB instruction:', {
                vertexTitle: r.title,
                dbId: dbInst.id,
                dbTitle: dbInst.title
              })
              return {
                id: dbInst.id,
                title: dbInst.title,
                content: r.content || dbInst.content || '', // Prefer Vertex snippet, fallback to DB content
                severity: dbInst.severity,
                folder_id: dbInst.folder_id,
                updated_at: dbInst.updated_at,
                similarity: r.score
              }
            }
            
            // Fallback: use Vertex data as-is (may have UUID as title)
            return {
              id: r.id,
              title: r.title,
              content: r.content,
              severity: 'normal',
              folder_id: null,
              updated_at: null,
              similarity: r.score
            }
          })
          
          console.log('[ASK_DEBUG] Enriched instructions count:', enrichedInstructions.length)
          return {
            instructions: enrichedInstructions,
            usedVectorSearch: true
          }
        }
      }
      
      // No database match found for Vertex results - skip to embedding search
      // This happens when Vertex Data Store has stale documents not in the database
      console.log('[ASK_DEBUG] Vertex results found but no DB match, falling back to embedding search')
    } else {
      console.log('[ASK_DEBUG] Vertex search returned 0 results')
    }
  } catch (vertexError) {
    console.warn('[ASK] Vertex Search failed, falling back to database:', vertexError)
  }

  const queryKeywords = extractKeywords(question, 5)

  // Try hybrid search first (vector + full-text) if embeddings are configured
  if (process.env.GOOGLE_CREDENTIALS_JSON || process.env.OPENAI_API_KEY) {
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

        const filteredResults = filterByKeywordOverlap(queryKeywords, results)
        if (filteredResults.length === 0) {
          return { instructions: [], usedVectorSearch: true }
        }
        return {
          instructions: filteredResults as VectorSearchResult[],
          usedVectorSearch: true // Indicates hybrid was used
        }
      }

      // Fallback to legacy match_instructions if no chunks exist yet
      if (hybridError?.message?.includes('instruction_chunks') || hybridResults?.length === 0) {
        const { data: vectorResults, error: vectorError } = await supabase
          .rpc('match_instructions', {
            query_embedding: embeddingStr,
            match_threshold: VECTOR_SEARCH_THRESHOLD,
            match_count: 10,
            p_user_id: userId
          })

        if (!vectorError && vectorResults && vectorResults.length > 0) {
          const filteredResults = filterByKeywordOverlap(queryKeywords, vectorResults)
          if (filteredResults.length === 0) {
            return { instructions: [], usedVectorSearch: true }
          }
          return {
            instructions: filteredResults as VectorSearchResult[],
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
    const { instructions: rawInstructions, usedVectorSearch } = await findRelevantInstructions(
      supabase,
      question,
      userId,
      orgId
    )

    // Apply smart re-ranking based on title match, severity, and recency
    const relevantInstructions = smartRerank(rawInstructions, question)

    if (relevantInstructions.length === 0) {
      await logUnansweredQuestion(supabase, orgId, userId, question)
      return Response.json({ answer: FALLBACK_ANSWER, source: null })
    }

    // Build context from instructions
    // SECURITY: Mask PII before sending to third-party AI (GDPR compliance)
    const context = relevantInstructions.map(inst => {
      const folderName = getFolderNameFromInstruction(inst)
      const severity = getSeverityFromInstruction(inst)
      // Mask PII in content before sending to AI
      const maskedContent = maskPII(inst.content || '')
      return '---\nDOKUMENT: ' + folderName + inst.title + '\nALVORLIGHET: ' + severity + '\nINNHOLD:\n' + maskedContent + '\n---'
    }).join('\n\n')

    // Also mask PII in the user's question
    const maskedQuestion = maskPII(question)

    // Debug logging - only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[ASK_DEBUG] Context length:', context.length, 'chars')
      console.log('[ASK_DEBUG] Instructions count:', relevantInstructions.length)
    }

    const systemPrompt = `Du er Tetrivo, en intern HMS-assistent for en bedrift.

    DINE INSTRUKSJONER:
    1. Du skal svare på spørsmålet basert PÅ INFORMASJONEN I DOKUMENTUTDRAGENE nedenfor. 
    2. Utdragene kan være bruddstykker. Hvis de innholder relevant informasjon (f.eks. telefonnummer, rutiner, hva man skal gjøre), SKAL du bruke dette til å forme et svar.
    3. Start svaret med "Basert på dokumentet [tittel]:". Hvis tittelen ser ut som en ID (f.eks. tall/bokstaver), bruk den likevel.
    4. Hvis du IKKE finner svaret i teksten, svar nøyaktig: "${FALLBACK_ANSWER}"
    5. Ikke dikt opp informasjon som ikke står i teksten.
    6. Ikke legg til egne vurderinger ("Jeg anbefaler...", "Det er viktig at...").

    DOKUMENTUTDRAG:
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
            let fullText = ''

            await streamGeminiAnswer(
              systemPrompt,
              [{ role: 'user', content: maskedQuestion }],
              (textChunk) => {
                fullText += textChunk
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: textChunk })}\n\n`))
              }
            )

            // Send source metadata at the end
            if (fullText.trim() !== FALLBACK_ANSWER) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'source', content: sourceData })}\n\n`))
            }
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
    const geminiAnswer = await generateGeminiAnswer(
      systemPrompt,
      [{ role: 'user', content: maskedQuestion }]
    )

    const answer = geminiAnswer || 'Kunne ikke generere svar.'


    const normalizedAnswer = answer.trim()
    const isFallback = normalizedAnswer === FALLBACK_ANSWER

    // Question was answered - no logging needed

    return Response.json({
      answer: normalizedAnswer,
      source: isFallback ? null : sourceData,
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
    const maskedQuestion = maskPII(question)
    const { error } = await supabase.from('ai_unanswered_questions').insert({
      org_id: orgId,
      user_id: userId,
      question: maskedQuestion
    })
    if (error) console.error('ASK_LOG_ERROR: ai_unanswered_questions insert', error)
  } catch (err) {
    console.error('ASK_LOG_ERROR:', err)
  }
}
