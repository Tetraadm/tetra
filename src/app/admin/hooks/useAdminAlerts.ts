import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import type { createClient } from '@/lib/supabase/client'
import type { Alert, Profile } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

type UseAdminAlertsOptions = {
  profile: Profile
  initialAlerts: Alert[]
  supabase: SupabaseClient
  onCloseCreateAlert?: () => void
}

type NewAlertState = {
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
      toast.success('Avvik opprettet')
    } catch (error) {
      console.error('Create alert error:', error)
      toast.error('Kunne ikke opprette avvik. Prøv igjen.')
    } finally {
      setAlertLoading(false)
    }
  }, [newAlert, onCloseCreateAlert, profile.org_id, supabase])

  const toggleAlert = useCallback(async (alertId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ active: !active })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, active: !active } : a))
      toast.success(active ? 'Avvik deaktivert' : 'Avvik aktivert')
    } catch (error) {
      console.error('Toggle alert error:', error)
      toast.error('Kunne ikke endre avviksstatus. Prøv igjen.')
    }
  }, [supabase])

  const deleteAlert = useCallback(async (alertId: string) => {
    if (!confirm('Slette dette avviket?')) return

    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error

      setAlerts(prev => prev.filter(a => a.id !== alertId))
      toast.success('Avvik slettet')
    } catch (error) {
      console.error('Delete alert error:', error)
      toast.error('Kunne ikke slette avvik. Prøv igjen.')
    }
  }, [supabase])

  return {
    alerts,
    newAlert,
    alertLoading,
    setNewAlert,
    setAlerts,
    createAlert,
    toggleAlert,
    deleteAlert
  }
}
