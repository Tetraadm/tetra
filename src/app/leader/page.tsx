import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaderDashboard from './LeaderDashboard'

export const dynamic = 'force-dynamic'

export default async function LeaderPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*), teams(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login?error=Profil ikke funnet')
  }

  // Role-based redirect: non-teamleaders go to their correct dashboard
  if (profile.role !== 'teamleader') {
    if (profile.role === 'admin') {
      redirect('/admin')
    }
    redirect('/employee')
  }

  // Fetch team members
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .eq('team_id', profile.team_id)
    .order('full_name')

  // Fetch instructions via security-definer RPC (team + org-wide)
  const { data: instructions, error: instructionsError } = await supabase
    .rpc('get_user_instructions', { p_user_id: user.id })

  if (instructionsError) {
    console.error('get_user_instructions failed', instructionsError)
  }

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
