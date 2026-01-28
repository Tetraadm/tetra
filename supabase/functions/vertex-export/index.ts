/**
 * Vertex AI Export Edge Function
 *
 * Exports instructions to JSONL format with orgId metadata for Vertex AI Search.
 * Actions: export-all, export-single
 *
 * H-01 Security: Enables org filtering in Vertex AI Search by including
 * orgId in structData metadata.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.10'

const GCS_BUCKET = Deno.env.get('GCS_BUCKET_NAME')

interface ExportRequest {
  action: 'export-all' | 'export-single'
  instructionId?: string // Required for export-single
}

interface InstructionRow {
  id: string
  title: string
  content: string
  severity: string
  org_id: string
}

interface JsonlDocument {
  id: string
  structData: {
    orgId: string
    title: string
    severity: string
  }
  jsonData: string // Inline content as JSON string
}

// ========== Google Auth ==========
function getProjectId(): string {
  const credentialsJson = Deno.env.get('GOOGLE_CREDENTIALS_JSON')
  if (!credentialsJson) throw new Error('GOOGLE_CREDENTIALS_JSON not set')
  return JSON.parse(credentialsJson).project_id
}

async function getAccessToken(scopes: string[]): Promise<string> {
  const credentialsJson = Deno.env.get('GOOGLE_CREDENTIALS_JSON')
  if (!credentialsJson) throw new Error('GOOGLE_CREDENTIALS_JSON not set')
  const credentials = JSON.parse(credentialsJson)

  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    iss: credentials.client_email,
    scope: scopes.join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  }

  const base64url = (obj: object) => {
    const json = JSON.stringify(obj)
    const base64 = btoa(json)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  const encodedHeader = base64url(header)
  const encodedPayload = base64url(payload)
  const signatureInput = `${encodedHeader}.${encodedPayload}`

  const privateKey = credentials.private_key
  const keyData = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')

  const binaryKey = Uint8Array.from(atob(keyData), (c: string) => c.charCodeAt(0))

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  )

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  const jwt = `${signatureInput}.${signature}`

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  })

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text()
    throw new Error(`Failed to get access token: ${error}`)
  }

  const tokenData = await tokenResponse.json()
  return tokenData.access_token
}
// ========== End Google Auth ==========

/**
 * Upload text content to GCS
 */
async function uploadToGcs(
  accessToken: string,
  bucket: string,
  path: string,
  content: string,
  contentType: string
): Promise<void> {
  const encodedPath = encodeURIComponent(path)
  const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o?uploadType=media&name=${encodedPath}`

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': contentType
    },
    body: content
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`GCS upload failed: ${error}`)
  }
}

/**
 * Build JSONL document entry for Discovery Engine
 * Uses jsonData for inline content (more reliable than content.uri)
 */
function buildJsonlDocument(instruction: InstructionRow): JsonlDocument {
  // Inline content as JSON object with title and body
  const contentObject = {
    title: instruction.title,
    body: instruction.content
  }

  return {
    id: `instruction-${instruction.id}`,
    structData: {
      orgId: instruction.org_id,
      title: instruction.title,
      severity: instruction.severity
    },
    jsonData: JSON.stringify(contentObject)
  }
}

// Edge Function Secret for internal auth (H-001 security fix)
const EDGE_SECRET = Deno.env.get('EDGE_FUNCTION_SECRET')

serve(async (req: Request) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-edge-secret',
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  // Verify Edge Function Secret (C-002 security fix: fail-hard)
  if (!EDGE_SECRET) {
    console.error('EDGE_FUNCTION_SECRET is not configured')
    return new Response(
      JSON.stringify({ error: 'Server misconfigured' }),
      { headers, status: 503 }
    )
  }
  const clientSecret = req.headers.get('X-Edge-Secret')
  if (clientSecret !== EDGE_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers, status: 401 }
    )
  }

  if (!GCS_BUCKET) {
    console.error('GCS_BUCKET_NAME is not configured')
    return new Response(
      JSON.stringify({ error: 'Server misconfigured' }),
      { headers, status: 503 }
    )
  }

  try {
    const payload: ExportRequest = await req.json()
    const { action, instructionId } = payload

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const accessToken = await getAccessToken(['https://www.googleapis.com/auth/cloud-platform'])
    const projectId = getProjectId()

    console.log(`Vertex Export: action=${action}, projectId=${projectId}`)

    switch (action) {
      case 'export-all': {
        // Fetch all published instructions with content
        const { data: instructions, error } = await supabase
          .from('instructions')
          .select('id, title, content, severity, org_id')
          .eq('status', 'published')
          .is('deleted_at', null)
          .not('content', 'is', null)

        if (error) {
          throw new Error(`Database query failed: ${error.message}`)
        }

        if (!instructions || instructions.length === 0) {
          return new Response(
            JSON.stringify({
              success: true,
              message: 'No published instructions found',
              exported: 0
            }),
            { headers }
          )
        }

        console.log(`Found ${instructions.length} published instructions to export`)

        // Build JSONL with inline content (no separate file uploads needed)
        const jsonlLines: string[] = []

        for (const instruction of instructions as InstructionRow[]) {
          const jsonlDoc = buildJsonlDocument(instruction)
          jsonlLines.push(JSON.stringify(jsonlDoc))
        }

        // Upload JSONL file
        const jsonlContent = jsonlLines.join('\n')
        await uploadToGcs(
          accessToken,
          GCS_BUCKET,
          'vertex-export/export.jsonl',
          jsonlContent,
          'application/x-ndjson'
        )

        console.log(`Exported ${instructions.length} instructions to JSONL`)

        return new Response(
          JSON.stringify({
            success: true,
            exported: instructions.length,
            jsonlPath: `gs://${GCS_BUCKET}/vertex-export/export.jsonl`
          }),
          { headers }
        )
      }

      case 'export-single': {
        if (!instructionId) {
          return new Response(
            JSON.stringify({ error: 'instructionId required for export-single' }),
            { headers, status: 400 }
          )
        }

        // Fetch single instruction
        const { data: instruction, error } = await supabase
          .from('instructions')
          .select('id, title, content, severity, org_id')
          .eq('id', instructionId)
          .eq('status', 'published')
          .is('deleted_at', null)
          .not('content', 'is', null)
          .single()

        if (error || !instruction) {
          return new Response(
            JSON.stringify({
              error: 'Instruction not found or not published',
              instructionId
            }),
            { headers, status: 404 }
          )
        }

        const typedInstruction = instruction as InstructionRow

        // Build JSONL entry with inline content
        const jsonlDoc = buildJsonlDocument(typedInstruction)
        const jsonlContent = JSON.stringify(jsonlDoc)

        // Upload to a per-instruction JSONL file for incremental imports
        await uploadToGcs(
          accessToken,
          GCS_BUCKET,
          `vertex-export/single/${typedInstruction.id}.jsonl`,
          jsonlContent,
          'application/x-ndjson'
        )

        console.log(`Exported single instruction: ${instructionId}`)

        return new Response(
          JSON.stringify({
            success: true,
            instructionId,
            jsonlPath: `gs://${GCS_BUCKET}/vertex-export/single/${typedInstruction.id}.jsonl`
          }),
          { headers }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { headers, status: 400 }
        )
    }

  } catch (error) {
    console.error('Vertex Export error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers, status: 500 }
    )
  }
})
