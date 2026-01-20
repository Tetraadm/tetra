import { SupabaseClient } from '@supabase/supabase-js'

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

