import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiRatelimit, getClientIp } from '@/lib/ratelimit'
import { z } from 'zod'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const askSchema = z.object({
  question: z.string().min(1).max(1000),
  orgId: z.string().uuid(),
  userId: z.string().uuid().optional(),
})

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
        { error: 'Ugyldig input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { question, orgId, userId } = validation.data

    const supabase = await createClient()

    const { data: allInstructions } = await supabase
      .from('instructions')
      .select('id, title, content, severity, folder_id, folders(name), file_url')
      .eq('org_id', orgId)
      .eq('status', 'published')

    // Skill mellom instrukser med tekst og instrukser som kun er filer
    const instructionsWithContent = (allInstructions || []).filter(i => i.content && i.content.trim())
    const instructionsOnlyFiles = (allInstructions || []).filter(i => !i.content || !i.content.trim())

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

    const context = instructionsWithContent.map(inst => {
      const foldersData = inst.folders as unknown
      const folderObj = Array.isArray(foldersData) ? foldersData[0] : foldersData
      const folderName = folderObj && typeof folderObj === 'object' && 'name' in folderObj ? '[' + folderObj.name + '] ' : ''
      return '---\nDOKUMENT: ' + folderName + inst.title + '\nALVORLIGHET: ' + inst.severity + '\nINNHOLD:\n' + inst.content + '\n---'
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

    let sourceInstruction = null
    for (const inst of instructionsWithContent) {
      if (answer.toLowerCase().includes(inst.title.toLowerCase())) {
        sourceInstruction = inst
        break
      }
    }

    await supabase.from('ask_tetra_logs').insert({
      org_id: orgId,
      user_id: userId,
      question,
      answer,
      source_instruction_id: sourceInstruction?.id || null
    })

    const sourceFolders = sourceInstruction?.folders as unknown
    const sourceFolderObj = Array.isArray(sourceFolders) ? sourceFolders[0] : sourceFolders
    const sourceFolderName = sourceFolderObj && typeof sourceFolderObj === 'object' && 'name' in sourceFolderObj ? (sourceFolderObj as {name: string}).name : null

    return NextResponse.json({
      answer,
      source: sourceInstruction ? {
        id: sourceInstruction.id,
        title: sourceInstruction.title,
        folder: sourceFolderName,
        severity: sourceInstruction.severity
      } : null
    })

  } catch (error) {
    console.error('Ask API error:', error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}