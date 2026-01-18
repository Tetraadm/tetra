export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

const ADMIN_PAGE_SIZE = 50
const ALERT_PAGE_SIZE = 50
const FOLDER_PAGE_SIZE = 200
const AI_LOG_PAGE_SIZE = 100

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login?error=Profil ikke funnet')
  }

  // Role-based redirect: non-admins go to their correct dashboard
  if (profile.role !== 'admin') {
    if (profile.role === 'teamleader') {
      redirect('/leader')
    }
    redirect('/employee')
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(ADMIN_PAGE_SIZE)

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(ADMIN_PAGE_SIZE)

  const { data: instructions } = await supabase
    .from('instructions')
    .select('*, folders(*)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(ADMIN_PAGE_SIZE)

  const { data: folders } = await supabase
    .from('folders')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(FOLDER_PAGE_SIZE)

  const { data: alerts } = await supabase
    .from('alerts')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(ALERT_PAGE_SIZE)

  // Hent AI-logger
  const { data: aiLogs } = await supabase
    .from('ask_tetra_logs')
    .select('*, profiles(full_name), instructions(title)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(AI_LOG_PAGE_SIZE)

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