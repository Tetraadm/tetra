/**
 * Vertex AI Admin Edge Function
 * 
 * Admin operations for Vertex AI Search Data Store.
 * Actions: list-datastores, import-gcs, check-status, list-documents
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const LOCATION = 'global'
const GCS_BUCKET = Deno.env.get('GCS_BUCKET_NAME')

interface AdminRequest {
  action: 'list-datastores' | 'import-gcs' | 'check-status' | 'list-documents'
  dataStoreId?: string
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
    const payload: AdminRequest = await req.json()
    const { action, dataStoreId } = payload

    const projectId = getProjectId()
    const accessToken = await getAccessToken(['https://www.googleapis.com/auth/cloud-platform'])
    const baseUrl = `https://discoveryengine.googleapis.com/v1/projects/${projectId}/locations/${LOCATION}`

    console.log(`Vertex Admin: action=${action}, projectId=${projectId}`)

    switch (action) {
      case 'list-datastores': {
        const response = await fetch(
          `${baseUrl}/collections/default_collection/dataStores`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )
        const data = await response.json()
        return new Response(JSON.stringify(data), { headers })
      }

      case 'list-documents': {
        if (!dataStoreId) {
          return new Response(
            JSON.stringify({ error: 'dataStoreId required' }),
            { headers, status: 400 }
          )
        }
        const response = await fetch(
          `${baseUrl}/collections/default_collection/dataStores/${dataStoreId}/branches/default_branch/documents`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )
        const data = await response.json()
        return new Response(JSON.stringify(data), { headers })
      }

      case 'import-gcs': {
        if (!dataStoreId) {
          return new Response(
            JSON.stringify({ error: 'dataStoreId required' }),
            { headers, status: 400 }
          )
        }

        // Import documents from GCS bucket
        const importBody = {
          gcsSource: {
            inputUris: [`gs://${GCS_BUCKET}/*`],
            dataSchema: 'content'
          },
          reconciliationMode: 'INCREMENTAL'
        }

        const response = await fetch(
          `${baseUrl}/collections/default_collection/dataStores/${dataStoreId}/branches/default_branch/documents:import`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(importBody)
          }
        )

        const data = await response.json()
        console.log('Import response:', JSON.stringify(data))
        return new Response(JSON.stringify(data), { headers })
      }

      case 'check-status': {
        // Get info about available data stores and their document counts
        const dsResponse = await fetch(
          `${baseUrl}/collections/default_collection/dataStores`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )
        const datastores = await dsResponse.json()

        // List operations to check for pending imports
        const opsResponse = await fetch(
          `${baseUrl}/operations`,
          {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          }
        )
        const operations = await opsResponse.json()

        return new Response(
          JSON.stringify({
            projectId,
            gcsBucket: GCS_BUCKET,
            datastores: datastores.dataStores || [],
            pendingOperations: (operations.operations || []).filter(
              (op: Record<string, unknown>) => !op.done
            )
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
    console.error('Vertex Admin error:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers, status: 500 }
    )
  }
})
