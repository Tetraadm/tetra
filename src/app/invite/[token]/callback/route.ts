import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const origin = url.origin
  const code = url.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Mangler kode`)
  }

  // Create response first to bind cookies
  const response = NextResponse.redirect(new URL('/login', origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // Get user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=Kunne ikke hente bruker`)
  }

  // Get invite token from URL path
  const pathParts = request.url.split('/invite/')[1]?.split('/callback')[0]
  const token = pathParts || ''

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=Mangler invite token`)
  }

  // Get localStorage data for full_name (stored client-side before auth)
  // Since we can't access localStorage here, we'll use email as fallback
  // and expect client to update profile later if needed

  // Use RPC function for atomic invite acceptance
  const { data: profile, error: acceptError } = await supabase.rpc('accept_invite', {
    p_token: token,
    p_full_name: user.email?.split('@')[0] || 'Bruker'
  })

  if (acceptError) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(acceptError.message)}`)
  }

  if (!profile) {
    return NextResponse.redirect(`${origin}/login?error=Kunne ikke akseptere invitasjon`)
  }

  // Redirect based on role
  const dest =
    profile.role === 'admin' ? '/admin' :
    profile.role === 'teamleader' ? '/leader' :
    '/employee'

  response.headers.set('Location', new URL(dest, origin).toString())
  return response
}