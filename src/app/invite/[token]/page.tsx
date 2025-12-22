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

  // Check if expired
  if (new Date(invite.expires_at) < new Date()) {
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