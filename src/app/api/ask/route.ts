import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiRatelimit, getClientIp } from '@/lib/ratelimit'
import { z } from 'zod'
import { extractKeywords, filterAndRankInstructions, type InstructionWithKeywords } from '@/lib/keyword-extraction'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const askSchema = z.object({
  question: z.string().min(1).max(1000),
  orgId: z.string().uuid(),
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

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const { success, limit, remaining, reset } = await aiRatelimit.limit(ip)

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

    // Input validation
    const body = await request.json()
    const validation = askSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Ugyldig input' },
        { status: 400 }
      )
    }

    const { question, orgId, userId } = validation.data

    const supabase = await createClient()

    let allInstructions: InstructionWithKeywords[] = []

    if (userId) {
      const { data, error } = await supabase
        .rpc('get_user_instructions', { p_user_id: userId })

      if (error) {
        console.error('ASK_FATAL: get_user_instructions failed', error)
        return NextResponse.json({ error: 'Kunne ikke hente instrukser' }, { status: 500 })
      }

      allInstructions = (data || []) as InstructionWithKeywords[]
    } else {
      const { data, error } = await supabase
        .from('instructions')
        .select('id, title, content, severity, folder_id, folders(name), file_path, keywords')
        .eq('org_id', orgId)
        .eq('status', 'published')

      if (error) {
        console.error('ASK_FATAL: instructions fetch failed', error)
        return NextResponse.json({ error: 'Kunne ikke hente instrukser' }, { status: 500 })
      }

      allInstructions = (data || []) as InstructionWithKeywords[]
    }

    const normalizedInstructions = (allInstructions || []).map(inst => ({
      ...inst,
      keywords: normalizeKeywords(inst.keywords)
    }))

    // Skill mellom instrukser med tekst og instrukser som kun er filer
    const instructionsWithContent = normalizedInstructions.filter(i => i.content && i.content.trim())
    const instructionsOnlyFiles = normalizedInstructions.filter(i => !i.content || !i.content.trim())

    if (instructionsWithContent.length === 0) {
      let answer = 'Ingen instrukser med tekstinnhold er tilgjengelig for AI-assistenten.'

      if (instructionsOnlyFiles.length > 0) {
        answer += ` Det finnes ${instructionsOnlyFiles.length} instruks(er) som kun er tilgjengelig som PDF/fil. Gå til "Instrukser"-fanen for å se dem.`
      }

      await supabase.from('ask_tetra_logs').insert({
        org_id: orgId,
        user_id: userId,
        question,
        answer,
        source_instruction_id: null
      })

      return NextResponse.json({
        answer,
        source: null
      })
    }

    // NEW: Filter and rank instructions based on query keywords
    const relevantInstructions = filterAndRankInstructions(
      question,
      instructionsWithContent as InstructionWithKeywords[],
      10 // Limit to top 10 most relevant instructions
    )

    // If no relevant instructions found, fall back to all instructions (up to 10)
    const instructionsToUse = relevantInstructions.length > 0
      ? relevantInstructions
      : instructionsWithContent.slice(0, 10)

    // Build context from filtered instructions
    const context = instructionsToUse.map(inst => {
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
5. Hvis svaret IKKE finnes i dokumentene nedenfor, svar NØYAKTIG: "Jeg finner ingen instruks for dette i systemet. Kontakt ansvarlig leder for veiledning."
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

    const sourceInstruction = instructionsToUse[0] || null

    await supabase.from('ask_tetra_logs').insert({
      org_id: orgId,
      user_id: userId,
      question,
      answer,
      source_instruction_id: sourceInstruction?.id || null
    })

    const sourceFolderName = sourceInstruction
      ? getFolderNameFromInstruction(sourceInstruction)
      : ''

    return NextResponse.json({
      answer,
      source: sourceInstruction ? {
        id: sourceInstruction.id,
        title: sourceInstruction.title,
        folder: sourceFolderName || null,
        severity: getSeverityFromInstruction(sourceInstruction) || null
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
