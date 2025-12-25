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
    redirect('/login?error=Du må bli invitert for å bruke Tetra')
  }

  // Fetch instructions for this user's team
  let instructions = []
  
  if (profile.team_id) {
    const { data } = await supabase
      .from('instructions')
      .select('id, title, content, severity, file_url, instruction_teams!inner(team_id)')
      .eq('instruction_teams.team_id', profile.team_id)
      .eq('status', 'approved')
      .order('severity')
    instructions = data || []
  } else {
    const { data } = await supabase
      .from('instructions')
      .select('id, title, content, severity, file_url')
      .eq('org_id', profile.org_id)
      .eq('status', 'approved')
      .order('severity')
    instructions = data || []
  }

  // Fetch active alerts for this user's team
  let alerts = []
  
  if (profile.team_id) {
    const { data } = await supabase
      .from('alerts')
      .select('id, title, description, severity, alert_teams!inner(team_id)')
      .eq('alert_teams.team_id', profile.team_id)
      .eq('active', true)
      .order('severity')
    alerts = data || []
  } else {
    const { data } = await supabase
      .from('alerts')
      .select('id, title, description, severity')
      .eq('org_id', profile.org_id)
      .eq('active', true)
      .order('severity')
    alerts = data || []
  }

  return (
    <EmployeeApp
      profile={profile}
      organization={profile.organizations}
      team={profile.teams}
      instructions={instructions}
      alerts={alerts}
    />
  )
}