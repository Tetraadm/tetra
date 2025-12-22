import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaderDashboard from './LeaderDashboard'

export default async function LeaderPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*), teams(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teamleader') {
    redirect('/login')
  }

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .eq('team_id', profile.team_id)
    .order('full_name')

  // Fetch instructions for this team
  const { data: instructions } = await supabase
    .from('instructions')
    .select('*, instruction_teams!inner(*)')
    .eq('instruction_teams.team_id', profile.team_id)
    .eq('status', 'approved')
    .order('severity')

  return (
    <LeaderDashboard
      profile={profile}
      organization={profile.organizations}
      team={profile.teams}
      teamMembers={teamMembers || []}
      instructions={instructions || []}
    />
  )
}