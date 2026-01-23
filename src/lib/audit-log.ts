import { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// GDPR: PII Sanitization Helpers
// Minimize personal data stored in audit logs
// ============================================================

/**
 * Sanitizes an email address for audit logging.
 * GDPR-compliant: Masks both local and domain parts.
 * Converts "user@example.com" to "u***@e***.com"
 */
export function sanitizeEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  const [local, domain] = email.split('@')

  // Mask local part
  const maskedLocal = local.length <= 1 ? `${local}***` : `${local[0]}***`

  // Mask domain part (keep TLD for context)
  const domainParts = domain.split('.')
  if (domainParts.length >= 2) {
    const tld = domainParts[domainParts.length - 1]
    const domainName = domainParts.slice(0, -1).join('.')
    const maskedDomain = domainName.length <= 1
      ? `${domainName}***`
      : `${domainName[0]}***`
    return `${maskedLocal}@${maskedDomain}.${tld}`
  }

  // Fallback for unusual domains
  const maskedDomain = domain.length <= 1 ? `${domain}***` : `${domain[0]}***`
  return `${maskedLocal}@${maskedDomain}`
}

/**
 * Recursively sanitizes PII in an object.
 * Looks for common PII field names and sanitizes their values.
 */
export function sanitizePII(obj: Record<string, unknown>): Record<string, unknown> {
  const piiFields = ['email', 'inviteeEmail', 'user_email', 'userEmail']
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (piiFields.includes(key) && typeof value === 'string') {
      result[key] = sanitizeEmail(value)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizePII(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result
}

export type AuditActionType =
  // Instructions
  | 'create_instruction'
  | 'update_instruction'
  | 'publish_instruction'
  | 'unpublish_instruction'
  | 'delete_instruction'
  // Alerts
  | 'create_alert'
  | 'update_alert'
  | 'toggle_alert'
  | 'delete_alert'
  // Folders
  | 'create_folder'
  | 'delete_folder'
  // Teams
  | 'create_team'
  | 'delete_team'
  // Users
  | 'create_user'
  | 'edit_user'
  | 'delete_user'
  | 'invite_user'
  | 'change_role'

export type AuditEntityType = 'instruction' | 'alert' | 'folder' | 'team' | 'user' | 'invite'

type AuditLogParams = {
  actionType: AuditActionType
  entityType: AuditEntityType
  entityId?: string
  details?: Record<string, unknown>
}

/**
 * F-05 Fix: Server-side audit logging via API
 * 
 * This function calls the /api/audit endpoint which:
 * 1. Validates user authentication
 * 2. Sets org_id and user_id from server-side session (tamper-proof)
 * 3. Inserts the audit log entry
 * 
 * Use this instead of logAuditEventClient for tamper-resistant logging.
 */
export async function logAuditEvent(
  params: AuditLogParams
): Promise<void> {
  try {
    const response = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details
      })
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('Failed to log audit event:', error)
    }
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}

/**
 * @deprecated Use logAuditEvent instead for tamper-resistant logging.
 * This function inserts directly from client which can be manipulated.
 * Kept for backwards compatibility with existing code.
 */
export async function logAuditEventClient(
  supabase: SupabaseClient,
  params: {
    orgId: string
    userId: string
    actionType: AuditActionType
    entityType: AuditEntityType
    entityId?: string
    details?: Record<string, unknown>
  }
): Promise<void> {
  // Redirect to server-side logging
  await logAuditEvent({
    actionType: params.actionType,
    entityType: params.entityType,
    entityId: params.entityId,
    details: params.details
  })
}

