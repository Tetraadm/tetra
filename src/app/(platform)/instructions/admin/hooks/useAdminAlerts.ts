import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { logAuditEventClient } from '@/lib/audit-log'
import type { createClient } from '@/lib/supabase/client'
import type { Alert, Profile } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

const PAGE_SIZE = 50

type UseAdminAlertsOptions = {
  profile: Profile
  initialAlerts: Alert[]
  supabase: SupabaseClient
  onCloseCreateAlert?: () => void
}

export type NewAlertState = {
  title: string
  description: string
  severity: string
  teamIds: string[]
  allTeams: boolean
}

export function useAdminAlerts({
  profile,
  initialAlerts,
  supabase,
  onCloseCreateAlert
}: UseAdminAlertsOptions) {
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts)
  const [alertsHasMore, setAlertsHasMore] = useState(initialAlerts.length >= PAGE_SIZE)
  const [alertsLoadingMore, setAlertsLoadingMore] = useState(false)
  const [newAlert, setNewAlert] = useState<NewAlertState>({
    title: '',
    description: '',
    severity: 'medium',
    teamIds: [],
    allTeams: true
  })
  const [alertLoading, setAlertLoading] = useState(false)

  const createAlert = useCallback(async () => {
    if (!newAlert.title.trim()) return
    if (!newAlert.allTeams && newAlert.teamIds.length === 0) {
      toast.error('Velg minst ett team eller bruk Alle team')
      return
    }
    setAlertLoading(true)

    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          title: newAlert.title,
          description: newAlert.description,
          severity: newAlert.severity,
          org_id: profile.org_id,
          active: true
        })
        .select()
        .single()

      if (error) throw error

      const teamIdsToLink = newAlert.allTeams
        ? []
        : newAlert.teamIds

      if (teamIdsToLink.length > 0) {
        const { error: teamError } = await supabase.from('alert_teams').insert(
          teamIdsToLink.map(teamId => ({
            alert_id: data.id,
            team_id: teamId
          }))
        )
        if (teamError) console.error('Alert teams link error:', teamError)
      }

      setAlerts(prev => [data, ...prev])
      setNewAlert({ title: '', description: '', severity: 'medium', teamIds: [], allTeams: true })
      onCloseCreateAlert?.()
      toast.success('Kunngjøring opprettet')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'create_alert',
        entityType: 'alert',
        entityId: data.id,
        details: {
          alert_title: data.title,
          severity: data.severity
        }
      })
    } catch (error) {
      console.error('Create alert error:', error)
      toast.error('Kunne ikke opprette kunngjøring. Prøv igjen.')
    } finally {
      setAlertLoading(false)
    }
  }, [newAlert, onCloseCreateAlert, profile.id, profile.org_id, supabase])

  const toggleAlert = useCallback(async (alertId: string, active: boolean) => {
    try {
      const alertToToggle = alerts.find(a => a.id === alertId)

      const { error } = await supabase
        .from('alerts')
        .update({ active: !active })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, active: !active } : a))
      toast.success(active ? 'Kunngjøring deaktivert' : 'Kunngjøring aktivert')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'toggle_alert',
        entityType: 'alert',
        entityId: alertId,
        details: {
          alert_title: alertToToggle?.title || 'Ukjent',
          previous_active: active,
          new_active: !active
        }
      })
    } catch (error) {
      console.error('Toggle alert error:', error)
      toast.error('Kunne ikke endre status på kunngjøring. Prøv igjen.')
    }
  }, [alerts, profile.id, profile.org_id, supabase])

  const deleteAlert = useCallback(async (alertId: string) => {
    if (!confirm('Slette denne kunngjøringen? Den arkiveres og kan gjenopprettes av support.')) return

    try {
      const alertToDelete = alerts.find(a => a.id === alertId)

      // Soft-delete: set deleted_at instead of hard delete (compliance)
      const { error } = await supabase
        .from('alerts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => prev.filter(a => a.id !== alertId))
      toast.success('Kunngjøring slettet')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'delete_alert',
        entityType: 'alert',
        entityId: alertId,
        details: {
          alert_title: alertToDelete?.title || 'Ukjent',
          severity: alertToDelete?.severity || 'unknown',
          soft_delete: true
        }
      })
    } catch (error) {
      console.error('Delete alert error:', error)
      toast.error('Kunne ikke slette kunngjøring. Prøv igjen.')
    }
  }, [alerts, profile.id, profile.org_id, supabase])



const loadMoreAlerts = useCallback(async () => {
  if (alertsLoadingMore || !alertsHasMore) return
  setAlertsLoadingMore(true)

  try {
    const offset = alerts.length
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw error

    const nextAlerts = data || []
    setAlerts(prev => [...prev, ...nextAlerts])
    setAlertsHasMore(nextAlerts.length >= PAGE_SIZE)
  } catch (error) {
    console.error('Load more alerts error:', error)
    toast.error('Kunne ikke laste flere kunngjøringer. Prøv igjen.')
  } finally {
    setAlertsLoadingMore(false)
  }
}, [alerts.length, alertsHasMore, alertsLoadingMore, profile.org_id, supabase])

  return {
    alerts,
    newAlert,
    alertLoading,
    setNewAlert,
    setAlerts,
    createAlert,
    toggleAlert,
    deleteAlert,
    alertsHasMore,
    alertsLoadingMore,
    loadMoreAlerts
  }
}
