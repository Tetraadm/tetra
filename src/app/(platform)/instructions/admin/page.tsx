export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

const ADMIN_PAGE_SIZE = 50
const ALERT_PAGE_SIZE = 50
const FOLDER_PAGE_SIZE = 200
const UNANSWERED_PAGE_SIZE = 100

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
      redirect('/instructions/leader')
    }
    redirect('/instructions/employee')
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
    .is('deleted_at', null)
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

  // Hent ubesvarte spørsmål
  const { data: unansweredQuestions } = await supabase
    .from('ai_unanswered_questions')
    .select('*, profiles(full_name)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })
    .limit(UNANSWERED_PAGE_SIZE)

  const { count: openedInstructionCount } = await supabase
    .from('instruction_reads')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)

  const { count: aiQuestionCount } = await supabase
    .from('ask_tetra_logs')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)

  const { count: unansweredCount } = await supabase
    .from('ai_unanswered_questions')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)

  const { count: gdprPendingCount } = await supabase
    .from('gdpr_requests')
    .select('id', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)
    .eq('status', 'pending')

  const insightStats = {
    instructionsOpened: openedInstructionCount ?? 0,
    aiQuestions: aiQuestionCount ?? 0,
    unanswered: unansweredCount ?? unansweredQuestions?.length ?? 0
  }

  return (
    <AdminDashboard
      profile={profile}
      organization={profile.organizations}
      teams={teams || []}
      users={users || []}
      instructions={instructions || []}
      folders={folders || []}
      alerts={alerts || []}
      unansweredQuestions={unansweredQuestions || []}
      gdprPendingCount={gdprPendingCount ?? 0}
      insightStats={insightStats}
    />
  )
}
