import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { logAuditEventClient } from '@/lib/audit-log'
import type { createClient } from '@/lib/supabase/client'
import type { Profile, Team } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

type UseAdminTeamsOptions = {
  profile: Profile
  initialTeams: Team[]
  supabase: SupabaseClient
  onCloseCreateTeam?: () => void
}

export function useAdminTeams({
  profile,
  initialTeams,
  supabase,
  onCloseCreateTeam
}: UseAdminTeamsOptions) {
  const [teams, setTeams] = useState<Team[]>(initialTeams)
  const [newTeamName, setNewTeamName] = useState('')
  const [teamLoading, setTeamLoading] = useState(false)

  const createTeam = useCallback(async () => {
    if (!newTeamName.trim()) return
    setTeamLoading(true)

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name: newTeamName, org_id: profile.org_id })
        .select()
        .single()

      if (error) throw error

      setTeams(prev => [...prev, data])
      setNewTeamName('')
      onCloseCreateTeam?.()
      toast.success('Team opprettet')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'create_team',
        entityType: 'team',
        entityId: data.id,
        details: { team_name: data.name }
      })
    } catch (error) {
      console.error('Create team error:', error)
      toast.error('Kunne ikke opprette team. Prøv igjen.')
    } finally {
      setTeamLoading(false)
    }
  }, [newTeamName, onCloseCreateTeam, profile.id, profile.org_id, supabase])

  const deleteTeam = useCallback(async (teamId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette teamet? Brukere i teamet mister team-tilknytning.')) return

    try {
      const teamToDelete = teams.find(t => t.id === teamId)

      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error

      setTeams(prev => prev.filter(t => t.id !== teamId))
      toast.success('Team slettet')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'delete_team',
        entityType: 'team',
        entityId: teamId,
        details: { team_name: teamToDelete?.name || 'Ukjent' }
      })
    } catch (error) {
      console.error('Delete team error:', error)
      toast.error('Kunne ikke slette team. Prøv igjen.')
    }
  }, [profile.id, profile.org_id, supabase, teams])

  return {
    teams,
    setTeams,
    newTeamName,
    setNewTeamName,
    createTeam,
    deleteTeam,
    teamLoading
  }
}
