import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Mangler kode`)
  }

  const supabase = await createClient()
  
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Get user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=Kunne ikke hente bruker`)
  }

  // Get invite data from token in URL
  const pathParts = request.url.split('/invite/')[1]?.split('/callback')[0]
  const token = pathParts || ''

  if (token) {
    // Get invite
    const { data: invite } = await supabase
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (invite) {
      // Create profile
      await supabase.from('profiles').upsert({
        id: user.id,
        org_id: invite.org_id,
        team_id: invite.team_id,
        role: invite.role,
        full_name: user.email?.split('@')[0] || 'Bruker'
      })

      // Mark invite as used
      await supabase
        .from('invites')
        .update({ used: true })
        .eq('id', invite.id)

      // Redirect based on role
      if (invite.role === 'admin') {
        return NextResponse.redirect(`${origin}/admin`)
      } else if (invite.role === 'teamleader') {
        return NextResponse.redirect(`${origin}/leader`)
      } else {
        return NextResponse.redirect(`${origin}/employee`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/employee`)
}