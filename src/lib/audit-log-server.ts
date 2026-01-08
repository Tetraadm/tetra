import 'server-only'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { AuditActionType, AuditEntityType } from './audit-log'

type AuditLogParams = {
  orgId: string
  userId: string
  actionType: AuditActionType
  entityType: AuditEntityType
  entityId?: string
  details?: Record<string, any>
}

/**
 * Server-side audit logging function
 * Use this in API routes and server components
 */
export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createServerClient()

    await supabase.from('audit_logs').insert({
      org_id: params.orgId,
      user_id: params.userId,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      details: params.details || {}
    })
  } catch (error) {
    // Log to console but don't throw - audit logging shouldn't break main operations
    console.error('Failed to log audit event:', error)
  }
}
