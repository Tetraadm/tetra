import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiRatelimit, getClientIp } from '@/lib/ratelimit'
import { z } from 'zod'
import {
  calculateRelevanceScore,
  extractKeywords,
  type InstructionWithKeywords
} from '@/lib/keyword-extraction'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const FALLBACK_ANSWER = 'Jeg finner ingen relevant instruks i Tetra for dette. Kontakt din leder eller sikkerhetsansvarlig.'
const RAW_MIN_SCORE = Number(process.env.AI_MIN_RELEVANCE_SCORE ?? '0.35')
const MIN_SCORE = Number.isFinite(RAW_MIN_SCORE) ? RAW_MIN_SCORE : 0.35

const askSchema = z.object({
  question: z.string().min(1).max(1000),
  // orgId/userId kept for backward compatibility; server derives truth.
  orgId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
})

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
  inst: InstructionWithKeywords & { folders?: unknown }
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
  inst: InstructionWithKeywords & { severity?: unknown }
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

export async function POST(request: NextRequest) {
  try {
    // Input validation first (cheap operation)
    const body = await request.json()
    const validation = askSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ugyldig input' },
        { status: 400 }
      )
    }

    const { question, orgId: clientOrgId, userId: clientUserId } = validation.data

    const supabase = await createClient()

    // Enforce authenticated user and derive org/user from profile (ignores client-supplied ids)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting AFTER auth - use user.id for more accurate limits
    // This prevents IP-based bypass when multiple users share same IP (e.g., behind proxy)
    const ip = getClientIp(request)
    const rateLimitKey = `user:${user.id}`
    const { success, limit, remaining, reset, isMisconfigured } = await aiRatelimit.limit(rateLimitKey)

    // Fail-closed: if rate limiter is misconfigured in prod, return 503
    if (isMisconfigured) {
      console.error('ASK_FATAL: Rate limiter misconfigured (Upstash not configured in production)')
      return NextResponse.json(
        { error: 'Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.' },
        { status: 503 }
      )
    }

    if (!success) {
      return NextResponse.json(
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

    // Keep ip for potential logging (not used for rate limiting anymore)
    void ip

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('ASK_FATAL: profile fetch failed', profileError)
      return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 403 })
    }

    // If client sent ids, enforce they match the session
    if (clientOrgId && clientOrgId !== profile.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (clientUserId && clientUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const orgId = profile.org_id
    const userId = user.id

    let allInstructions: InstructionWithKeywords[] = []

    const { data, error } = await supabase
      .rpc('get_user_instructions', { p_user_id: userId })

    if (error) {
      console.error('ASK_FATAL: get_user_instructions failed', error)
      return NextResponse.json({ error: 'Kunne ikke hente instrukser' }, { status: 500 })
    }

    allInstructions = (data || []) as InstructionWithKeywords[]

    const normalizedInstructions = (allInstructions || []).map(inst => ({
      ...inst,
      keywords: normalizeKeywords(inst.keywords)
    }))

    // Skill mellom instrukser med tekst og instrukser som kun er filer
    const instructionsWithContent = normalizedInstructions.filter(i => i.content && i.content.trim())
    const queryKeywords = extractKeywords(question, 5)

    if (instructionsWithContent.length === 0 || queryKeywords.length === 0) {
      const { error: logError } = await supabase.from('ask_tetra_logs').insert({
        org_id: orgId,
        user_id: userId,
        question,
        answer: FALLBACK_ANSWER,
        source_instruction_id: null
      })
      if (logError) console.error('ASK_LOG_ERROR: ask_tetra_logs insert', logError)

      const { error: unansweredError } = await supabase.from('ai_unanswered_questions').insert({
        org_id: orgId,
        user_id: userId ?? null,
        question
      })
      if (unansweredError) console.error('ASK_LOG_ERROR: ai_unanswered_questions insert', unansweredError)

      return NextResponse.json({
        answer: FALLBACK_ANSWER,
        source: null
      })
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

    if (relevantInstructions.length === 0) {
      const { error: logError } = await supabase.from('ask_tetra_logs').insert({
        org_id: orgId,
        user_id: userId,
        question,
        answer: FALLBACK_ANSWER,
        source_instruction_id: null
      })
      if (logError) console.error('ASK_LOG_ERROR: ask_tetra_logs insert', logError)

      const { error: unansweredError } = await supabase.from('ai_unanswered_questions').insert({
        org_id: orgId,
        user_id: userId ?? null,
        question
      })
      if (unansweredError) console.error('ASK_LOG_ERROR: ai_unanswered_questions insert', unansweredError)

      return NextResponse.json({
        answer: FALLBACK_ANSWER,
        source: null
      })
    }
    // Build context from filtered instructions
    const context = relevantInstructions.map(inst => {
      const folderName = getFolderNameFromInstruction(inst)
      const severity = getSeverityFromInstruction(inst)
      return '---\nDOKUMENT: ' + folderName + inst.title + '\nALVORLIGHET: ' + severity + '\nINNHOLD:\n' + inst.content + '\n---'
    }).join('\n\n')

    const systemPrompt = `Du er Tetra, en intern HMS-assistent for en bedrift.

KRITISKE REGLER:
1. Du skal KUN sitere og gjengi informasjon fra DOKUMENTENE nedenfor.
2. Du har IKKE lov til å bruke ekstern kunnskap, egne vurderinger eller anbefalinger.
3. Du skal ALDRI legge til kommentarer som "Merk:", "Dette høres ut...", "Jeg anbefaler..." eller lignende.
4. Du skal ALDRI dikte opp prosedyrer eller gi egne råd.
5. Hvis svaret IKKE finnes i dokumentene nedenfor, svar NØYAKTIG: "Jeg finner ingen relevant instruks i Tetra for dette. Kontakt din leder eller sikkerhetsansvarlig."
6. Referer alltid til hvilket dokument svaret kommer fra ved å si "Basert på dokumentet [tittel]:" først.
7. Svar kort, faktabasert og kun med det som faktisk står i dokumentet.
8. Selv om innholdet virker rart eller uprofesjonelt, skal du BARE gjengi det uten å kommentere.
9. Du har KUN tilgang til dokumentene listet nedenfor. PDF-filer uten tekstutskrift er IKKE tilgjengelig for deg.

TILGJENGELIGE DOKUMENTER:
${context}`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }]
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text : 'Kunne ikke generere svar.'

    const sourceInstruction = relevantInstructions[0] || null

    const { error: logError } = await supabase.from('ask_tetra_logs').insert({
      org_id: orgId,
      user_id: userId,
      question,
      answer,
      source_instruction_id: sourceInstruction?.id || null
    })
    if (logError) console.error('ASK_LOG_ERROR: ask_tetra_logs insert', logError)

    return NextResponse.json({
      answer,
      source: sourceInstruction ? {
        instruction_id: sourceInstruction.id,
        title: sourceInstruction.title,
        updated_at: 'updated_at' in sourceInstruction
          ? (sourceInstruction as { updated_at?: string | null }).updated_at ?? null
          : null,
        open_url_or_route: `/employee?instruction=${sourceInstruction.id}`
      } : null
    })

  } catch (error) {
    console.error('ASK_FATAL:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: process.env.NODE_ENV === 'production'
        ? 'Kunne ikke behandle spørsmålet'
        : `Feil: ${message}`
    }, { status: 500 })
  }
}



