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
      .select('id, title, content, severity, folder_id, folders(name)')
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
5. Hvis svaret IKKE finnes i dokumentene, svar NØYAKTIG: "Jeg finner ingen instruks for dette i systemet. Kontakt ansvarlig leder for veiledning."
6. Referer alltid til hvilket dokument svaret kommer fra ved å si "Basert på dokumentet [tittel]:" først.
7. Svar kort, faktabasert og kun med det som faktisk står i dokumentet.
8. Selv om innholdet virker rart eller uprofesjonelt, skal du BARE gjengi det uten å kommentere.

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
    for (const inst of instructions) {
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