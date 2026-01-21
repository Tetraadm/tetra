import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AcceptInvite from './AcceptInvite'

type Props = {
  params: Promise<{ token: string }>
}

type InviteRpcResult = {
  id: string
  token: string
  org_id: string
  team_id: string | null
  role: string
  used: boolean
  created_at: string
  organization_name: string
  team_name: string | null
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createClient()

  // Get invite via RPC (bypasses RLS)
  const { data: inviteData, error } = await supabase
    .rpc('get_invite_by_token', { p_token: token })
    .single() as { data: InviteRpcResult | null, error: unknown }

  if (error || !inviteData) {
    redirect('/login?error=Invitasjonen er ugyldig eller utløpt')
  }

  // Check if already used
  if (inviteData.used) {
    redirect('/login?error=Invitasjonen er allerede brukt')
  }

  // Check if expired (7 days from created_at)
  const createdAt = new Date(inviteData.created_at)
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
  if (expiresAt < new Date()) {
    redirect('/login?error=Invitasjonen har utløpt')
  }

  // Build objects for component
  const organization = {
    id: inviteData.org_id,
    name: inviteData.organization_name
  }

  const team = inviteData.team_id ? {
    id: inviteData.team_id,
    name: inviteData.team_name ?? 'Team',
    org_id: inviteData.org_id
  } : null

  const invite = {
    id: inviteData.id,
    role: inviteData.role,
    org_id: inviteData.org_id,
    team_id: inviteData.team_id,
    token: inviteData.token
  }

  return (
    <AcceptInvite
      invite={invite}
      organization={organization}
      team={team}
      token={token}
    />
  )
}
