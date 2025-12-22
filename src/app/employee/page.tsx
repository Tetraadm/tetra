import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmployeeApp from './EmployeeApp'

export default async function EmployeePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*), teams(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/onboarding')
  }

  // Fetch instructions for this user's team (or all if no team)
  let instructions = []
  
  if (profile.team_id) {
    const { data } = await supabase
      .from('instructions')
      .select('*, instruction_teams!inner(*)')
      .eq('instruction_teams.team_id', profile.team_id)
      .eq('status', 'approved')
      .order('severity')
    instructions = data || []
  } else {
    // If no team, get all approved instructions in org
    const { data } = await supabase
      .from('instructions')
      .select('*')
      .eq('org_id', profile.org_id)
      .eq('status', 'approved')
      .order('severity')
    instructions = data || []
  }

  return (
    <EmployeeApp
      profile={profile}
      organization={profile.organizations}
      team={profile.teams}
      instructions={instructions}
    />
  )
}