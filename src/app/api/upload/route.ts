import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { uploadRatelimit, getClientIp } from '@/lib/ratelimit'
import { extractKeywords } from '@/lib/keyword-extraction'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg']

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request)
    const { success, limit, remaining, reset } = await uploadRatelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: 'For mange opplastinger. Prøv igjen om litt.' },
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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Filen er for stor. Maks størrelse er ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ugyldig filtype. Tillatte typer: PDF, TXT, PNG, JPG' },
        { status: 400 }
      )
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

    // Ekstraher tekst fra .txt filer
    // PDF-parsing er deaktivert pga serverless kompatibilitet
    let extractedText = ''
    if (file.type === 'text/plain') {
      extractedText = await file.text()
    }

    // NEW: Extract keywords from title and content
    const textForKeywords = `${title} ${extractedText}`.trim()
    const keywords = extractKeywords(textForKeywords, 10)

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
        file_path: fileName,
        keywords: keywords // NEW
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