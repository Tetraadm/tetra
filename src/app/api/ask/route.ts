import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const { question, orgId, userId } = await request.json()

    if (!question || !orgId) {
      return NextResponse.json({ error: 'Mangler spørsmål eller org' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: instructions } = await supabase
      .from('instructions')
      .select('id, title, content, severity')
      .eq('org_id', orgId)
      .eq('status', 'approved')

    if (!instructions || instructions.length === 0) {
      await supabase.from('ask_tetra_logs').insert({
        org_id: orgId,
        user_id: userId,
        question,
        answered: false
      })

      return NextResponse.json({
        answer: null,
        message: 'Ingen instrukser funnet.'
      })
    }

    const instructionContext = instructions.map(inst => 
      `[${inst.severity === 'critical' ? 'KRITISK' : inst.severity === 'medium' ? 'MIDDELS' : 'LAV'}] ${inst.title}: ${inst.content || 'Ingen beskrivelse'}`
    ).join('\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      system: `Du er Tetra, en sikkerhetsassistent. Svar KORT og PRESIST basert på instruksene under.

REGLER:
- Maks 2-3 setninger
- Nevn instruksen du bruker
- Si fra hvis du ikke finner svar
- Svar på norsk

INSTRUKSER:
${instructionContext}`,
      messages: [{ role: 'user', content: question }]
    })

    const answerText = message.content[0].type === 'text' ? message.content[0].text : ''

    let sourceInstruction = null
    for (const inst of instructions) {
      if (answerText.toLowerCase().includes(inst.title.toLowerCase().split(':')[0])) {
        sourceInstruction = inst
        break
      }
    }

    await supabase.from('ask_tetra_logs').insert({
      org_id: orgId,
      user_id: userId,
      question,
      answer: answerText,
      source_instruction_id: sourceInstruction?.id || null,
      answered: true
    })

    return NextResponse.json({
      answer: answerText,
      source: sourceInstruction ? {
        id: sourceInstruction.id,
        title: sourceInstruction.title,
        severity: sourceInstruction.severity
      } : null
    })

  } catch (error) {
    console.error('Ask Tetra error:', error)
    return NextResponse.json(
      { error: 'Kunne ikke behandle spørsmålet' },
      { status: 500 }
    )
  }
}