import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { logAuditEventClient } from '@/lib/audit-log'
import type { createClient } from '@/lib/supabase/client'
import type { Profile, Team } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

const PAGE_SIZE = 50

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
  const [teamsHasMore, setTeamsHasMore] = useState(initialTeams.length >= PAGE_SIZE)
  const [teamsLoadingMore, setTeamsLoadingMore] = useState(false)
  const [teamMemberCounts, setTeamMemberCounts] = useState<Record<string, number>>({})
  const [newTeamName, setNewTeamName] = useState('')
  const [teamLoading, setTeamLoading] = useState(false)


const loadTeamCounts = useCallback(async (teamIds: string[]) => {
  if (teamIds.length === 0) return

  try {
    const results = await Promise.all(teamIds.map(async (teamId) => {
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('team_id', teamId)

      if (error) throw error

      return { teamId, count: count || 0 }
    }))

    setTeamMemberCounts(prev => {
      const next = { ...prev }
      for (const result of results) {
        next[result.teamId] = result.count
      }
      return next
    })
  } catch (error) {
    console.error('Load team member counts error:', error)
  }
}, [supabase])

useEffect(() => {
  const missingIds = teams
    .map(team => team.id)
    .filter(teamId => teamMemberCounts[teamId] === undefined)

  if (missingIds.length > 0) {
    loadTeamCounts(missingIds)
  }
}, [teams, teamMemberCounts, loadTeamCounts])

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



const loadMoreTeams = useCallback(async () => {
  if (teamsLoadingMore || !teamsHasMore) return
  setTeamsLoadingMore(true)

  try {
    const offset = teams.length
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) throw error

    const nextTeams = data || []
    setTeams(prev => [...prev, ...nextTeams])
    setTeamsHasMore(nextTeams.length >= PAGE_SIZE)
  } catch (error) {
    console.error('Load more teams error:', error)
    toast.error('Kunne ikke laste flere team. Prøv igjen.')
  } finally {
    setTeamsLoadingMore(false)
  }
}, [profile.org_id, supabase, teams.length, teamsHasMore, teamsLoadingMore])

  return {
    teams,
    setTeams,
    newTeamName,
    setNewTeamName,
    createTeam,
    deleteTeam,
    teamMemberCounts,
    teamsHasMore,
    teamsLoadingMore,
    loadMoreTeams,
    teamLoading
  }
}
