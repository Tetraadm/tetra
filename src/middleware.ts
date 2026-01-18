import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Middleware for centralized authentication
 * 
 * Protected routes: /admin/*, /employee/*, /leader/*, /api/* (except public)
 * Public routes: /login, /invite/*, /auth/*, /, /api/health (if exists)
 * 
 * Unauthenticated users are redirected to /login
 * Authenticated users accessing /login are redirected to /post-auth
 */

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create response that will be returned (may be modified with cookies)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if exists (important for SSR)
  const { data: { user } } = await supabase.auth.getUser()

  // Protected route patterns
  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/employee') ||
    pathname.startsWith('/leader') ||
    pathname.startsWith('/post-auth')

  // API routes that need auth (exclude public endpoints)
  const isProtectedApi =
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/health')

  // Public routes (no auth required)
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/auth')

  // Redirect unauthenticated users from protected routes
  if (!user && (isProtectedRoute || isProtectedApi)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users from login to post-auth
  if (user && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/post-auth'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
