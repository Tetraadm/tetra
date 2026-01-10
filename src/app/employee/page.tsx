import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmployeeApp from './EmployeeApp'

export const dynamic = 'force-dynamic'

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

  // Fetch instructions and alerts via security-definer RPCs (team + org-wide)
  const { data: instructionsData, error: instructionsError } = await supabase
    .rpc('get_user_instructions', { p_user_id: user.id })

  if (instructionsError) {
    console.error('get_user_instructions failed', instructionsError)
  }

  const { data: alertsData, error: alertsError } = await supabase
    .rpc('get_user_alerts', { p_user_id: user.id })

  if (alertsError) {
    console.error('get_user_alerts failed', alertsError)
  }

  const instructions = instructionsData || []
  const alerts = alertsData || []

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
