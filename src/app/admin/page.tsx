import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

export default async function AdminPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/login')
  }

  // Fetch all data for the organization
  const [teamsRes, usersRes, instructionsRes, foldersRes, alertsRes] = await Promise.all([
    supabase.from('teams').select('*').eq('org_id', profile.org_id),
    supabase.from('profiles').select('*').eq('org_id', profile.org_id),
    supabase.from('instructions').select('*, folders(*)').eq('org_id', profile.org_id),
    supabase.from('folders').select('*').eq('org_id', profile.org_id),
    supabase.from('alerts').select('*').eq('org_id', profile.org_id).order('created_at', { ascending: false })
  ])

  return (
    <AdminDashboard
      profile={profile}
      organization={profile.organizations}
      teams={teamsRes.data || []}
      users={usersRes.data || []}
      instructions={instructionsRes.data || []}
      folders={foldersRes.data || []}
      alerts={alertsRes.data || []}
    />
  )
}