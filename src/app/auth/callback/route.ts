import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if user has a profile
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // Redirect based on role
        if (!profile) {
          return NextResponse.redirect(`${origin}/onboarding`)
        } else if (profile.role === 'admin') {
          return NextResponse.redirect(`${origin}/admin`)
        } else if (profile.role === 'teamleader') {
          return NextResponse.redirect(`${origin}/leader`)
        } else {
          return NextResponse.redirect(`${origin}/employee`)
        }
      }
    }
  }

  // Something went wrong
  return NextResponse.redirect(`${origin}/login?error=Kunne ikke logge inn`)
}