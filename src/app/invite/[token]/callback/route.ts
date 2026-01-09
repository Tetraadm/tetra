import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
      console.error('INVITE_FATAL: Exchange code failed', error.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
    }

    // Get session directly (more stable than getUser in same request)
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

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

    // Use RPC function for atomic invite acceptance
    const { error: acceptError } = await supabase.rpc('accept_invite', {
      p_token: token,
      p_full_name: user.email?.split('@')[0] || 'Bruker'
    })

    if (acceptError) {
      console.error('INVITE_FATAL: RPC accept_invite failed', acceptError.message)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(acceptError.message)}`)
    }

    // Redirect to post-auth for role routing in new request (cookies fully settled)
    response.headers.set('Location', new URL('/post-auth', origin).toString())
    return response
  } catch (error) {
    console.error('INVITE_FATAL: Unexpected error', error)
    const origin = new URL(request.url).origin
    return NextResponse.redirect(`${origin}/login?error=Noe gikk galt under invite-prosessen`)
  }
}