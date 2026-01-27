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
  onCloseEditAlert?: () => void
  onOpenEditAlert?: () => void
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
  onCloseCreateAlert,
  onCloseEditAlert,
  onOpenEditAlert
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
  
  // Edit alert state
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)
  const [editAlertTitle, setEditAlertTitle] = useState('')
  const [editAlertDescription, setEditAlertDescription] = useState('')
  const [editAlertSeverity, setEditAlertSeverity] = useState('')
  const [editAlertTeams, setEditAlertTeams] = useState<string[]>([])
  const [editAlertAllTeams, setEditAlertAllTeams] = useState(true)

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

  const openEditAlert = useCallback(async (alert: Alert) => {
    setEditingAlert(alert)
    setEditAlertTitle(alert.title)
    setEditAlertDescription(alert.description || '')
    setEditAlertSeverity(alert.severity)

    // Load current team mappings
    const { data: teamMappings } = await supabase
      .from('alert_teams')
      .select('team_id')
      .eq('alert_id', alert.id)

    const teamIds = teamMappings?.map(t => t.team_id) || []
    setEditAlertTeams(teamIds)
    setEditAlertAllTeams(teamIds.length === 0)
    onOpenEditAlert?.()
  }, [onOpenEditAlert, supabase])

  const saveEditAlert = useCallback(async () => {
    if (!editingAlert || !editAlertTitle.trim()) return
    if (!editAlertAllTeams && editAlertTeams.length === 0) {
      toast.error('Velg minst ett team eller bruk Alle team')
      return
    }
    setAlertLoading(true)

    try {
      const { data, error } = await supabase
        .from('alerts')
        .update({
          title: editAlertTitle,
          description: editAlertDescription,
          severity: editAlertSeverity
        })
        .eq('id', editingAlert.id)
        .select()
        .single()

      if (error) throw error

      // Update team mappings
      // First delete existing mappings
      await supabase
        .from('alert_teams')
        .delete()
        .eq('alert_id', editingAlert.id)

      // Then insert new mappings (if not all teams)
      const teamIdsToLink = editAlertAllTeams ? [] : editAlertTeams
      if (teamIdsToLink.length > 0) {
        const { error: teamError } = await supabase.from('alert_teams').insert(
          teamIdsToLink.map(teamId => ({
            alert_id: editingAlert.id,
            team_id: teamId
          }))
        )
        if (teamError) console.error('Alert teams link error:', teamError)
      }

      setAlerts(prev => prev.map(a => a.id === editingAlert.id ? data : a))
      setEditingAlert(null)
      onCloseEditAlert?.()
      toast.success('Kunngjøring oppdatert')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'update_alert',
        entityType: 'alert',
        entityId: data.id,
        details: {
          alert_title: data.title,
          severity: data.severity
        }
      })
    } catch (error) {
      console.error('Save edit alert error:', error)
      toast.error('Kunne ikke lagre endringer. Prøv igjen.')
    } finally {
      setAlertLoading(false)
    }
  }, [
    editAlertAllTeams,
    editAlertDescription,
    editAlertSeverity,
    editAlertTeams,
    editAlertTitle,
    editingAlert,
    onCloseEditAlert,
    profile.id,
    profile.org_id,
    supabase
  ])

const loadMoreAlerts = useCallback(async () => {
  if (alertsLoadingMore || !alertsHasMore) return
  setAlertsLoadingMore(true)

  try {
    const offset = alerts.length
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('org_id', profile.org_id)
      .is('deleted_at', null)
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
    openEditAlert,
    saveEditAlert,
    editingAlert,
    editAlertTitle,
    setEditAlertTitle,
    editAlertDescription,
    setEditAlertDescription,
    editAlertSeverity,
    setEditAlertSeverity,
    editAlertTeams,
    setEditAlertTeams,
    editAlertAllTeams,
    setEditAlertAllTeams,
    alertsHasMore,
    alertsLoadingMore,
    loadMoreAlerts
  }
}
