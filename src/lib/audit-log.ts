import { SupabaseClient } from '@supabase/supabase-js'

export type AuditActionType =
  | 'publish_instruction'
  | 'unpublish_instruction'
  | 'delete_instruction'
  | 'create_user'
  | 'edit_user'
  | 'delete_user'
  | 'invite_user'
  | 'change_role'

export type AuditEntityType = 'instruction' | 'user' | 'invite'

type AuditLogParams = {
  orgId: string
  userId: string
  actionType: AuditActionType
  entityType: AuditEntityType
  entityId?: string
  details?: Record<string, any>
}

/**
 * Client-side audit logging function (for Client Components)
 * Use this in client components like AdminDashboard.tsx
 */
export function logAuditEventClient(
  supabase: SupabaseClient,
  params: AuditLogParams
): Promise<void> {
  return supabase
    .from('audit_logs')
    .insert({
      org_id: params.orgId,
      user_id: params.userId,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details || {}
    })
    .then(() => {})
    .catch((error) => {
      console.error('Failed to log audit event:', error)
    })
}
