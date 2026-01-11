import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
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
    } catch (error) {
      console.error('Create team error:', error)
      toast.error('Kunne ikke opprette team. Prøv igjen.')
    } finally {
      setTeamLoading(false)
    }
  }, [newTeamName, onCloseCreateTeam, profile.org_id, supabase])

  const deleteTeam = useCallback(async (teamId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette teamet?')) return

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error

      setTeams(prev => prev.filter(t => t.id !== teamId))
      toast.success('Team slettet')
    } catch (error) {
      console.error('Delete team error:', error)
      toast.error('Kunne ikke slette team. Prøv igjen.')
    }
  }, [supabase])

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
