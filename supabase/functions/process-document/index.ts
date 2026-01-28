/**
 * Process Document Edge Function
 * 
 * Extracts text from PDFs using Google Document AI.
 * Provides better OCR, table extraction, and Norwegian language support.
 * 
 * Payload:
 * {
 *   instructionId: string
 *   filePath: string  // GCS path: orgId/uuid.pdf
 *   orgId: string
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'
import { getAccessToken, getProjectId } from '../_shared/google-auth.ts'

// Configuration
const DOCUMENT_AI_LOCATION = Deno.env.get('DOCUMENT_AI_LOCATION') || 'eu'
const DOCUMENT_AI_PROCESSOR_ID = Deno.env.get('DOCUMENT_AI_PROCESSOR_ID')
const GCS_BUCKET = Deno.env.get('GCS_BUCKET_NAME') || 'tetrivo-documents-eu'
const MAX_FILE_SIZE_MB = 10 // Document AI limit

/**
 * Safe base64 encoding for large ArrayBuffers
 * Avoids stack overflow from spread operator
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 8192
  let result = ''
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    result += String.fromCharCode(...chunk)
  }
  
  return btoa(result)
}

interface ProcessRequest {
  instructionId: string
  filePath: string
  orgId: string
  triggerEmbeddings?: boolean
}

serve(async (req: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    const payload: ProcessRequest = await req.json()
    console.log(`Processing document for instruction: ${payload.instructionId}`)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get the file from GCS
    const gcsUri = `gs://${GCS_BUCKET}/${payload.filePath}`
    
    let extractedText: string
    
    if (DOCUMENT_AI_PROCESSOR_ID) {
      // Use Document AI for extraction
      console.log('Extracting text with Document AI')
      extractedText = await extractWithDocumentAI(gcsUri)
    } else {
      // Fallback: Download file and use basic extraction
      console.log('Document AI not configured, using basic extraction')
      extractedText = await extractBasic(payload.filePath, supabase)
    }

    // Update instruction with extracted content
    const { error: updateError } = await supabase
      .from('instructions')
      .update({ content: extractedText })
      .eq('id', payload.instructionId)

    if (updateError) {
      throw new Error(`Failed to update instruction: ${updateError.message}`)
    }

    console.log(`Extracted ${extractedText.length} characters from document`)

    // Optionally trigger embedding generation
    if (payload.triggerEmbeddings !== false) {
      // Get instruction title
      const { data: instruction } = await supabase
        .from('instructions')
        .select('title')
        .eq('id', payload.instructionId)
        .single()

      if (instruction) {
        // Call the embeddings function
        const embeddingsUrl = `${supabaseUrl}/functions/v1/generate-embeddings`
        
        await fetch(embeddingsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            instructionId: payload.instructionId,
            title: instruction.title,
            content: extractedText,
            orgId: payload.orgId
          })
        })
        
        console.log('Triggered embedding generation')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        instructionId: payload.instructionId,
        extractedLength: extractedText.length,
        method: DOCUMENT_AI_PROCESSOR_ID ? 'document-ai' : 'basic'
      }),
      { headers, status: 200 }
    )

  } catch (error) {
    console.error('Error processing document:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers, status: 500 }
    )
  }
})

/**
 * Extract text using Google Document AI
 */
async function extractWithDocumentAI(gcsUri: string): Promise<string> {
  const projectId = getProjectId()
  const accessToken = await getAccessToken(['https://www.googleapis.com/auth/cloud-platform'])
  
  const processorName = `projects/${projectId}/locations/${DOCUMENT_AI_LOCATION}/processors/${DOCUMENT_AI_PROCESSOR_ID}`
  const endpoint = `https://${DOCUMENT_AI_LOCATION}-documentai.googleapis.com/v1/${processorName}:process`

  // For GCS files, we use batch processing endpoint
  // But for simplicity, we'll download and send inline
  const fileContent = await downloadFromGCS(gcsUri)
  
  // Safe base64 encoding that doesn't blow up the stack for large files
  const base64Content = arrayBufferToBase64(fileContent)

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      rawDocument: {
        content: base64Content,
        mimeType: 'application/pdf'
      }
    })
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Document AI error: ${error}`)
  }

  const data = await response.json()
  
  if (!data.document?.text) {
    throw new Error('Document AI returned no text')
  }

  return data.document.text
}

/**
 * Download file from GCS with size limit
 */
async function downloadFromGCS(gcsUri: string): Promise<ArrayBuffer> {
  const accessToken = await getAccessToken(['https://www.googleapis.com/auth/devstorage.read_only'])
  
  // Parse gs:// URI
  const match = gcsUri.match(/^gs:\/\/([^/]+)\/(.+)$/)
  if (!match) throw new Error(`Invalid GCS URI: ${gcsUri}`)
  
  const [, bucket, object] = match
  const encodedObject = encodeURIComponent(object)
  
  // First, check file size via metadata
  const metaUrl = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedObject}`
  const metaResponse = await fetch(metaUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })
  
  if (metaResponse.ok) {
    const metadata = await metaResponse.json()
    const sizeBytes = parseInt(metadata.size || '0', 10)
    const sizeMB = sizeBytes / (1024 * 1024)
    
    if (sizeMB > MAX_FILE_SIZE_MB) {
      throw new Error(`File too large: ${sizeMB.toFixed(1)}MB exceeds ${MAX_FILE_SIZE_MB}MB limit`)
    }
    
    console.log(`File size: ${sizeMB.toFixed(2)}MB`)
  }
  
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodedObject}?alt=media`
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GCS download error: ${error}`)
  }

  return response.arrayBuffer()
}

/**
 * Basic text extraction (fallback when Document AI not available)
 * Downloads from Supabase Storage
 */
async function extractBasic(
  filePath: string, 
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  // Download file from Supabase Storage
  const { data, error } = await supabase.storage
    .from('instructions')
    .download(filePath)

  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message || 'No data'}`)
  }

  // For PDFs, we need pdf-parse which isn't available in Deno
  // Return a placeholder - the upload route should have already extracted text
  console.warn('Basic extraction: PDF parsing not available in Edge Functions')
  return '[Content extraction pending - please re-upload or use Document AI]'
}
