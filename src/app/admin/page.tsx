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

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('org_id', profile.org_id)

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', profile.org_id)

  const { data: instructions } = await supabase
    .from('instructions')
    .select('*, folders(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('org_id', profile.org_id)

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  // Hent AI-logger
  const { data: aiLogs } = await supabase
    .from('ask_tetra_logs')
    .select('*, profiles(full_name), instructions(title)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <AdminDashboard
      profile={profile}
      organization={profile.organizations}
      teams={teams || []}
      users={users || []}
      instructions={instructions || []}
      folders={folders || []}
      alerts={alerts || []}
      aiLogs={aiLogs || []}
    />
  )
}