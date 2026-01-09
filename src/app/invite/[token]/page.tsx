import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AcceptInvite from './AcceptInvite'

type Props = {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Find the invite
  const { data: invite, error } = await supabase
    .from('invites')
    .select('*, organizations(*), teams(*)')
    .eq('token', token)
    .eq('used', false)
    .single()

  if (error || !invite) {
    redirect('/login?error=Invitasjonen er ugyldig eller utløpt')
  }

  // Check if expired (7 days from created_at)
  const createdAt = new Date(invite.created_at)
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
  if (expiresAt < new Date()) {
    redirect('/login?error=Invitasjonen har utløpt')
  }

  return (
    <AcceptInvite 
      invite={invite}
      organization={invite.organizations}
      team={invite.teams}
      token={token}
    />
  )
}