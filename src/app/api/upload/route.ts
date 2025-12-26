import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const severity = formData.get('severity') as string
    const status = formData.get('status') as string || 'draft'
    const orgId = formData.get('orgId') as string
    const userId = formData.get('userId') as string
    const folderId = formData.get('folderId') as string || null
    const teamIds = JSON.parse(formData.get('teamIds') as string || '[]')

    if (!file || !title || !orgId) {
      return NextResponse.json({ error: 'Mangler påkrevde felt' }, { status: 400 })
    }

    const supabase = await createClient()

    // Last opp fil til Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${orgId}/${crypto.randomUUID()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('instructions')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Kunne ikke laste opp fil' }, { status: 500 })
    }

    // Les tekst fra .txt filer
    let extractedText = ''
    if (file.type === 'text/plain') {
      extractedText = await file.text()
    }

    // Opprett instruks i databasen
    const { data: instruction, error: insertError } = await supabase
      .from('instructions')
      .insert({
        title,
        content: extractedText || null,
        severity,
        status,
        org_id: orgId,
        created_by: userId,
        folder_id: folderId || null,
        file_url: fileName
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Kunne ikke opprette instruks' }, { status: 500 })
    }

    // Koble til team
    if (instruction && teamIds.length > 0) {
      await supabase.from('instruction_teams').insert(
        teamIds.map((teamId: string) => ({
          instruction_id: instruction.id,
          team_id: teamId
        }))
      )
    }

    return NextResponse.json({ 
      success: true, 
      instruction,
      textExtracted: !!extractedText 
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}