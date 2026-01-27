export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { uploadRatelimit } from '@/lib/ratelimit'
import { extractKeywords } from '@/lib/keyword-extraction'
import { generateEmbedding, generateEmbeddings, prepareTextForEmbedding } from '@/lib/embeddings'
import { chunkText, prepareChunksForEmbedding } from '@/lib/chunking'
import { extractPdfText as documentAiExtract, isDocumentAIConfigured } from '@/lib/document-ai'
import { triggerEmbeddingGeneration, triggerDocumentProcessing, isEdgeFunctionsConfigured } from '@/lib/edge-functions'
import { z } from 'zod'
import DOMMatrixPolyfill from '@thednp/dommatrix'
import { Storage } from '@google-cloud/storage'
import { getGoogleAuthOptions } from '@/lib/vertex-auth'
import { storageLogger } from '@/lib/logger'


// Zod schema for upload form validation
const UploadFormSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().max(50000, 'Content too long').optional().default(''),
  severity: z.enum(['low', 'medium', 'critical']).default('medium'),
  status: z.enum(['draft', 'published']).default('draft'),
  orgId: z.string().uuid('Invalid organization ID'),
  folderId: z.string().uuid().nullable().optional(),
  teamIds: z.array(z.string().uuid()).default([]),
  allTeams: z.boolean().default(false),
})

// PDF processing limits - configurable via env vars
const PDF_MAX_PAGES = parseInt(process.env.PDF_MAX_PAGES || '50', 10)
const PDF_TIMEOUT_MS = parseInt(process.env.PDF_TIMEOUT_MS || '20000', 10) // P0-3: Reduced from 30s to 20s total budget
const PDF_MAX_CHARS = parseInt(process.env.PDF_MAX_CHARS || '500000', 10)
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'tetrivo-documents-eu'

type GlobalPdfPolyfills = typeof globalThis & {
  DOMMatrix?: typeof DOMMatrix
  DOMMatrixReadOnly?: typeof DOMMatrix
  DOMPoint?: typeof DOMPoint
  DOMPointReadOnly?: typeof DOMPoint
}

const globalPdfPolyfills = globalThis as GlobalPdfPolyfills

if (typeof globalPdfPolyfills.DOMMatrix === 'undefined') {
  globalPdfPolyfills.DOMMatrix = DOMMatrixPolyfill as unknown as typeof DOMMatrix
  globalPdfPolyfills.DOMMatrixReadOnly = DOMMatrixPolyfill as unknown as typeof DOMMatrix
}

if (typeof globalPdfPolyfills.DOMPoint === 'undefined') {
  class DOMPointPolyfill {
    x: number
    y: number
    z: number
    w: number

    constructor(x = 0, y = 0, z = 0, w = 1) {
      this.x = x
      this.y = y
      this.z = z
      this.w = w
    }
  }

  globalPdfPolyfills.DOMPoint = DOMPointPolyfill as unknown as typeof DOMPoint
  globalPdfPolyfills.DOMPointReadOnly = DOMPointPolyfill as unknown as typeof DOMPoint
}

/**
 * Extract text from PDF using Google Document AI or pdf-parse fallback.
 * Document AI provides better handling of:
 * - Tables and structured content
 * - OCR for scanned documents  
 * - Norwegian language support
 */
async function extractPdfText(pdfBytes: Uint8Array): Promise<string> {
  // Use Document AI if configured (recommended)
  if (isDocumentAIConfigured()) {
    storageLogger.info({ bytes: pdfBytes.length }, 'Extracting PDF with Document AI')
    return documentAiExtract(pdfBytes)
  }

  // Fallback to pdf-parse
  storageLogger.info({ bytes: pdfBytes.length }, 'Extracting PDF with pdf-parse (Document AI not configured)')
  
  // Use dynamic import for legacy CommonJS module compatibility
  const { default: pdfParse } = await import('pdf-parse')

  try {
    // Convert Uint8Array to Buffer for pdf-parse
    const buffer = Buffer.from(pdfBytes)

    // Create a timeout promise
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`PDF parsing timed out after ${PDF_TIMEOUT_MS}ms`))
      }, PDF_TIMEOUT_MS)
    })

    // Race between parsing and timeout
    const data = await Promise.race([
      pdfParse(buffer, { max: PDF_MAX_PAGES }),
      timeoutPromise
    ])

    if (timeoutId) clearTimeout(timeoutId)

    const text = data.text
    console.log('[PDF] Extraction success. Pages:', data.numrender, 'Chars:', text.length)

    // Basic cleanup and char limit check
    if (text.length > PDF_MAX_CHARS) {
      console.warn(`[PDF] Truncating text: ${text.length} -> ${PDF_MAX_CHARS}`)
      return text.slice(0, PDF_MAX_CHARS)
    }

    return text.trim()

  } catch (error) {
    console.error('[PDF] Extraction failed:', error)
    throw error
  }
}

const DEFAULT_MAX_UPLOAD_MB = 10
const RAW_MAX_UPLOAD_MB = Number.parseInt(process.env.MAX_UPLOAD_MB ?? '', 10)
const MAX_UPLOAD_MB = Number.isFinite(RAW_MAX_UPLOAD_MB) && RAW_MAX_UPLOAD_MB > 0
  ? RAW_MAX_UPLOAD_MB
  : DEFAULT_MAX_UPLOAD_MB
const MAX_FILE_SIZE = MAX_UPLOAD_MB * 1024 * 1024
const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain', 'image/png', 'image/jpeg']

// Magic bytes signatures for file type validation
// This prevents attackers from spoofing file.type (which is client-supplied)
const FILE_SIGNATURES: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  'image/png': [0x89, 0x50, 0x4E, 0x47],       // .PNG
  'image/jpeg': [0xFF, 0xD8, 0xFF],            // JPEG SOI marker
}

function validateFileSignature(bytes: Uint8Array, mimeType: string): boolean {
  const signature = FILE_SIGNATURES[mimeType]
  if (!signature) {
    // text/plain has no magic bytes - accept if declared as text
    return mimeType === 'text/plain'
  }
  if (bytes.length < signature.length) {
    return false
  }
  return signature.every((byte, i) => bytes[i] === byte)
}

type SupabaseErrorDetails = {
  code?: string
  details?: string
  hint?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Parse and validate form data with Zod
    const rawData = {
      file: formData.get('file'),
      title: formData.get('title'),
      content: formData.get('content') || '',
      severity: formData.get('severity') || 'medium',
      status: formData.get('status') || 'draft',
      orgId: formData.get('orgId'),
      folderId: formData.get('folderId') || null,
      teamIds: (() => {
        try {
          return JSON.parse(formData.get('teamIds') as string || '[]')
        } catch {
          return []
        }
      })(),
      allTeams: formData.get('allTeams') === 'true',
    }

    const parseResult = UploadFormSchema.safeParse(rawData)

    if (!parseResult.success) {
      const errors = parseResult.error.issues.map(i => i.message).join(', ')
      return NextResponse.json({ error: `Valideringsfeil: ${errors}` }, { status: 400 })
    }

    const { file, title, content, severity, status, orgId, folderId, teamIds, allTeams } = parseResult.data

    if (!allTeams && teamIds.length === 0) {
      return NextResponse.json(
        { error: 'Velg minst ett team eller bruk Alle team' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Filen er for stor. Maks størrelse er ${MAX_UPLOAD_MB}MB` },
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

    // Rate limiting AFTER auth - use user.id for accurate per-user limits
    const rateLimitKey = `user:${user.id}`
    const { success, limit, remaining, reset, isMisconfigured } = await uploadRatelimit.limit(rateLimitKey)

    // Fail-closed: if rate limiter is misconfigured in prod, return 503
    if (isMisconfigured) {
      console.error('UPLOAD_FATAL: Rate limiter misconfigured (Upstash not configured in production)')
      return NextResponse.json(
        { error: 'Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.' },
        { status: 503 }
      )
    }

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

    // Verify user profile and check if user belongs to the org
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('PROFILE_FETCH_ERROR', profileError)
      return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 403 })
    }

    // Only admins can upload instructions
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Kun administratorer kan laste opp instrukser' }, { status: 403 })
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

    // Validate file signature (magic bytes) to prevent MIME type spoofing
    if (!validateFileSignature(fileBytes, file.type)) {
      return NextResponse.json(
        { error: 'Filinnholdet matcher ikke oppgitt filtype' },
        { status: 400 }
      )
    }

    const adminClient = createServiceRoleClient()
    const { error: uploadError } = await adminClient.storage
      .from('instructions')
      .upload(fileName, fileBytes, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      const errorDetails = uploadError as SupabaseErrorDetails
      console.error('STORAGE_UPLOAD_ERROR', {
        message: uploadError.message,
        code: errorDetails.code,
        details: errorDetails.details
      })
      return NextResponse.json({ error: 'Kunne ikke laste opp filen' }, { status: 500 })
    }

    // Google Cloud Storage Upload (Parallel, don't fail main request if this fails)
    try {
      const storage = new Storage({
        ...getGoogleAuthOptions(),
        projectId: getGoogleAuthOptions().projectId // Ensure projectId is passed explicitly if needed
      })
      const bucket = storage.bucket(GCS_BUCKET_NAME)
      const gcsFile = bucket.file(fileName)

      // Upload to GCS
      // We use the raw buffer
      await gcsFile.save(Buffer.from(fileBytes), {
        metadata: {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: user.id,
            orgId: orgId
          }
        }
      })
      storageLogger.info({ fileName }, 'GCS upload success')
    } catch (gcsError) {
      storageLogger.warn({ error: gcsError, fileName }, 'GCS upload failed (non-fatal)')
      // We don't fail the request because the Supabase part (critical) succeeded
    }

    // Ekstraher tekst fra .txt og .pdf
    storageLogger.info({ fileName: file.name, type: file.type, size: file.size }, 'Processing file')

    let extractedText = ''
    if (file.type === 'text/plain') {
      extractedText = await file.text()
    } else if (file.type === 'application/pdf') {
      try {
        extractedText = await extractPdfText(fileBytes)
      } catch (err) {
        storageLogger.error({ error: err }, 'PDF parse error')
      }
    } else {
      storageLogger.warn({ type: file.type }, 'Unsupported file type for extraction')
    }

    // NEW: Extract keywords from title and content
    const effectiveContent = content?.trim() ? content.trim() : (extractedText || '')
    const textForKeywords = `${title} ${effectiveContent}`.trim()
    const keywords = extractKeywords(textForKeywords, 10)

    // Opprett instruks i databasen (use service client to bypass RLS since we verified admin above)
    const { data: instruction, error: insertError } = await adminClient
      .from('instructions')
      .insert({
        title,
        content: effectiveContent || null,
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
      const errorDetails = insertError as SupabaseErrorDetails
      console.error('INSTRUCTION_INSERT_ERROR', {
        message: insertError.message,
        code: errorDetails.code,
        details: errorDetails.details,
        hint: errorDetails.hint
      })
      const { error: cleanupError } = await adminClient.storage
        .from('instructions')
        .remove([fileName])

      if (cleanupError) {
        console.error('INSTRUCTION_FILE_CLEANUP_ERROR', cleanupError)
      }

      return NextResponse.json({ error: 'Kunne ikke opprette instruks' }, { status: 500 })
    }

    // Update GCS metadata with instruction ID and title (for Vertex AI Search)
    if (instruction) {
      try {
        const storage = new Storage({
          ...getGoogleAuthOptions(),
          projectId: getGoogleAuthOptions().projectId
        })
        const bucket = storage.bucket(GCS_BUCKET_NAME)
        const gcsFile = bucket.file(fileName)
        
        await gcsFile.setMetadata({
          metadata: {
            instructionId: instruction.id,
            title: title,
            originalName: file.name,
            uploadedBy: user.id,
            orgId: orgId
          }
        })
        storageLogger.info({ instructionId: instruction.id }, 'GCS metadata updated')
      } catch (metadataError) {
        storageLogger.warn({ error: metadataError }, 'GCS metadata update failed (non-fatal)')
      }
    }

    // Generate embeddings - use Edge Functions for async processing
    if (instruction && isEdgeFunctionsConfigured()) {
      if (effectiveContent) {
        // Content available - trigger embedding generation directly
        triggerEmbeddingGeneration({
          instructionId: instruction.id,
          title: title,
          content: effectiveContent,
          orgId: orgId
        }).then(success => {
          if (success) {
            storageLogger.info({ instructionId: instruction.id }, 'Embeddings queued via Edge Function')
          }
        }).catch(err => {
          storageLogger.warn({ error: err }, 'Edge Function trigger failed')
        })
        
        storageLogger.info({ instructionId: instruction.id }, 'Embedding generation triggered async')
      } else if (file.type === 'application/pdf') {
        // PDF with no extracted content - use Document AI Edge Function
        // This will extract text and then trigger embedding generation
        triggerDocumentProcessing({
          instructionId: instruction.id,
          filePath: fileName,
          orgId: orgId,
          triggerEmbeddings: true
        }).then(success => {
          if (success) {
            storageLogger.info({ instructionId: instruction.id }, 'Document processing queued via Edge Function')
          }
        }).catch(err => {
          storageLogger.warn({ error: err }, 'Document processing Edge Function trigger failed')
        })
        
        storageLogger.info({ instructionId: instruction.id }, 'Document processing triggered async for PDF')
      }
    } else if (instruction && effectiveContent) {
      // Sync fallback: Generate embeddings immediately (no Edge Functions)
      try {
        const textForEmbedding = prepareTextForEmbedding(title, effectiveContent)
        const fullEmbedding = await generateEmbedding(textForEmbedding)

        const { error: embeddingError } = await adminClient
          .from('instructions')
          .update({ embedding: JSON.stringify(fullEmbedding) })
          .eq('id', instruction.id)

        if (embeddingError) {
          storageLogger.error({ error: embeddingError }, 'Failed to store embedding')
        }

        // Generate chunks with embeddings
        const chunks = chunkText(effectiveContent)

        if (chunks.length > 0) {
          const chunkTexts = prepareChunksForEmbedding(title, chunks)
          const chunkEmbeddings = await generateEmbeddings(chunkTexts)

          const chunkInserts = chunks.map((chunk, idx) => ({
            instruction_id: instruction.id,
            chunk_index: chunk.index,
            content: chunk.content,
            embedding: JSON.stringify(chunkEmbeddings[idx])
          }))

          const { error: chunksError } = await adminClient
            .from('instruction_chunks')
            .insert(chunkInserts)

          if (chunksError) {
            storageLogger.error({ error: chunksError }, 'Failed to insert chunks')
          }
        }
        
        storageLogger.info({ instructionId: instruction.id }, 'Embeddings generated synchronously')
      } catch (embeddingErr) {
        // Log but don't fail the upload
        storageLogger.error({ error: embeddingErr }, 'Embedding generation failed')
      }
    }

    // Koble til team - men valider først at alle team tilhører riktig org
    if (instruction && teamIds.length > 0) {
      // Validate that all teamIds belong to the user's org
      const { data: validTeams, error: teamCheckError } = await supabase
        .from('teams')
        .select('id')
        .eq('org_id', orgId)
        .in('id', teamIds)

      if (teamCheckError) {
        console.error('TEAM_VALIDATION_ERROR', teamCheckError)
        return NextResponse.json({ error: 'Kunne ikke validere team' }, { status: 500 })
      }

      const validTeamIds = validTeams?.map(t => t.id) || []
      const invalidTeamIds = teamIds.filter((id: string) => !validTeamIds.includes(id))

      if (invalidTeamIds.length > 0) {
        console.warn('INVALID_TEAM_IDS', { invalidTeamIds, orgId })
        return NextResponse.json(
          { error: 'Ett eller flere team tilhører ikke din organisasjon' },
          { status: 400 }
        )
      }

      const { error: teamLinkError } = await supabase.from('instruction_teams').insert(
        teamIds.map((teamId: string) => ({
          instruction_id: instruction.id,
          team_id: teamId
        }))
      )

      // If team linking fails, rollback by soft-deleting the instruction
      // This prevents instructions from being visible org-wide when team linking fails
      if (teamLinkError) {
        console.error('INSTRUCTION_TEAMS_INSERT_ERROR', teamLinkError)
        // Soft-delete the instruction to prevent org-wide visibility
        await supabase
          .from('instructions')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', instruction.id)

        const { error: cleanupError } = await adminClient.storage
          .from('instructions')
          .remove([fileName])

        if (cleanupError) {
          console.error('INSTRUCTION_FILE_CLEANUP_ERROR', cleanupError)
        }

        return NextResponse.json(
          { error: 'Kunne ikke koble instruks til team. Prøv igjen.' },
          { status: 500 }
        )
      }
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

