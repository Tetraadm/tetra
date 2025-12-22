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

  // Fetch all data for admin
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('name')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('full_name')

  const { data: instructions } = await supabase
    .from('instructions')
    .select('*, folders(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('name')

  return (
    <AdminDashboard
      profile={profile}
      organization={profile.organizations}
      teams={teams || []}
      users={users || []}
      instructions={instructions || []}
      folders={folders || []}
    />
  )
}