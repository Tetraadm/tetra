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
  orgId: string
  userId: string
  actionType: AuditActionType
  entityType: AuditEntityType
  entityId?: string
  details?: Record<string, unknown>
}

/**
 * Client-side audit logging function (for Client Components)
 * Use this in client components like AdminDashboard.tsx
 */
export async function logAuditEventClient(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        org_id: params.orgId,
        user_id: params.userId,
        action_type: params.actionType,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        details: params.details || {}
      })
  } catch (error) {
    console.error('Failed to log audit event:', error)
  }
}
