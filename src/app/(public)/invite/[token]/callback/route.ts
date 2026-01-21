import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

type CookieOptions = Omit<Parameters<NextResponse["cookies"]["set"]>[0], "name" | "value">

export async function GET(request: NextRequest) {
  try {
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
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('INVITE_FATAL: Exchange code failed', error.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // getUser() gjør en sikker server-side JWT-verifisering
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) console.error('INVITE: getUser failed', userError.message)

    if (!user) {
      console.error('INVITE_FATAL: No user after session exchange')
      return NextResponse.redirect(`${origin}/login?error=Kunne ikke hente bruker`)
    }

    // Get invite token from URL path
    const pathParts = request.url.split('/invite/')[1]?.split('/callback')[0]
    const token = pathParts || ''

    if (!token) {
      console.error('INVITE_FATAL: No token in URL path')
      return NextResponse.redirect(`${origin}/login?error=Mangler invite token`)
    }

    // Get full name from cookie (set by AcceptInvite form)
    const fullNameCookie = request.cookies.get('invite_fullname')?.value
    const fullName = fullNameCookie ? decodeURIComponent(fullNameCookie) : (user.email?.split('@')[0] || 'Bruker')

    // Use RPC function for atomic invite acceptance
    const { error: acceptError } = await supabase.rpc('accept_invite', {
      p_token: token,
      p_full_name: fullName
    })

    if (acceptError) {
      console.error('INVITE_FATAL: RPC accept_invite failed', acceptError.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(acceptError.message)}`)
    }

    // Clear the invite_fullname cookie
    response.cookies.set({ name: 'invite_fullname', value: '', path: '/', maxAge: 0 })

    // Redirect to post-auth for role routing in new request (cookies fully settled)
    response.headers.set('Location', new URL('/post-auth', origin).toString())
    return response
  } catch (error) {
    console.error('INVITE_FATAL: Unexpected error', error)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/login?error=Noe gikk galt under invite-prosessen`)
  }
}
