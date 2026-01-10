export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { uploadRatelimit, getClientIp } from '@/lib/ratelimit'
import { extractKeywords } from '@/lib/keyword-extraction'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg']

// Service role client for storage operations (bypasses RLS)
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return undefined },
        set() {},
        remove() {}
      }
    }
  )
}

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

    // Authenticate and verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    // Verify user profile and check if user belongs to the org
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 403 })
    }

    // Verify orgId matches user's org (prevent uploading to other orgs)
    if (profile.org_id !== orgId) {
      return NextResponse.json({ error: 'Ikke tilgang til denne organisasjonen' }, { status: 403 })
    }

    // Last opp fil til Storage using service role (bypasses RLS)
    const fileExt = file.name.split('.').pop()
    const fileName = `${orgId}/${crypto.randomUUID()}.${fileExt}`

    // Convert file to buffer for service client
    const fileBuffer = await file.arrayBuffer()
    const fileBytes = new Uint8Array(fileBuffer)

    const adminClient = createServiceClient()
    const { error: uploadError } = await adminClient.storage
      .from('instructions')
      .upload(fileName, fileBytes, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('STORAGE_UPLOAD_ERROR', uploadError)
      return NextResponse.json({
        error: uploadError.message,
        code: (uploadError as any).code,
        details: (uploadError as any).details
      }, { status: 500 })
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
        created_by: user.id,
        folder_id: folderId || null,
        file_path: fileName,
        keywords: keywords // NEW
      })
      .select()
      .single()

    if (insertError) {
      console.error('INSTRUCTION_INSERT_ERROR', insertError)
      return NextResponse.json({
        error: insertError.message,
        code: (insertError as any).code,
        details: (insertError as any).details,
        hint: (insertError as any).hint
      }, { status: 500 })
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
