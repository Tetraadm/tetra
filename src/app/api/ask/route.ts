@'
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const { question, orgId, userId } = await request.json()

    if (!question || !orgId) {
      return NextResponse.json({ error: 'Mangler spørsmål eller org' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: instructions } = await supabase
      .from('instructions')
      .select('id, title, content, severity, folders(name)')
      .eq('org_id', orgId)
      .eq('status', 'published')
      .not('content', 'is', null)

    if (!instructions || instructions.length === 0) {
      await supabase.from('ask_tetra_logs').insert({
        org_id: orgId,
        user_id: userId,
        question,
        answer: 'Ingen publiserte instrukser tilgjengelig.',
        source_instruction_id: null
      })

      return NextResponse.json({
        answer: 'Det finnes ingen publiserte instrukser i systemet ennå. Kontakt ansvarlig leder.',
        source: null
      })
    }

    const context = instructions.map(inst => {
      const folder = inst.folders as { name: string } | null
      const folderName = folder?.name ? `[${folder.name}] ` : ''
      return `---
DOKUMENT: ${folderName}${inst.title}
ALVORLIGHET: ${inst.severity}
INNHOLD:
${inst.content}
---`
    }).join('\n\n')

    const systemPrompt = `Du er Tetra, en intern HMS-assistent for en bedrift.

KRITISKE REGLER DU MÅ FØLGE:
1. Du skal KUN svare basert på informasjonen i DOKUMENTENE nedenfor.
2. Du har IKKE lov til å bruke ekstern kunnskap, generell viten, eller egne meninger.
3. Hvis svaret IKKE finnes i dokumentene, skal du svare NØYAKTIG dette:
   "Jeg finner ingen instruks for dette i systemet. Kontakt ansvarlig leder for veiledning."
4. Du skal ALDRI dikte opp prosedyrer, regler eller informasjon.
5. Du skal ALLTID referere til hvilket dokument svaret kommer fra.
6. Hold svarene korte, presise og profesjonelle.
7. Svar på norsk.

TILGJENGELIGE DOKUMENTER:
${context}

Hvis brukeren spør om noe som IKKE dekkes av dokumentene ovenfor, bruk standardsvaret i punkt 3.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }]
    })

    const answer = response.content[0].type === 'text' ? response.content[0].text : 'Kunne ikke generere svar.'

    let sourceInstruction = null
    for (const inst of instructions) {
      if (answer.toLowerCase().includes(inst.title.toLowerCase())) {
        const folder = inst.folders as { name: string } | null
        sourceInstruction = { ...inst, folders: folder }
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

    return NextResponse.json({
      answer,
      source: sourceInstruction ? {
        id: sourceInstruction.id,
        title: sourceInstruction.title,
        folder: sourceInstruction.folders?.name || null,
        severity: sourceInstruction.severity
      } : null
    })

  } catch (error) {
    console.error('Ask API error:', error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}
'@ | Out-File -FilePath "src/app/api/ask/route.ts" -Encoding UTF8