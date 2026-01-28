import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Middleware for centralized authentication and CSP
 * 
 * M-01: CSP nonce generation for strict Content Security Policy
 * 
 * Protected routes: /admin/*, /employee/*, /leader/*, /api/* (except public)
 * Public routes: /login, /invite/*, /auth/*, /, /api/health (if exists)
 * 
 * Unauthenticated users are redirected to /login
 * Authenticated users accessing /login are redirected to /post-auth
 */

// Cookie options type for Supabase SSR
interface CookieOptions {
  domain?: string
  path?: string
  expires?: Date
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  maxAge?: number
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ========================================================================
  // EXPLICIT PUBLIC ROUTES - Skip ALL auth logic for these paths
  // This prevents any possibility of redirect loops
  // ========================================================================
  // SECURITY: /api/gdpr-cleanup uses its own Bearer token auth (for cron jobs)
  // We allow it through middleware but the route validates GDPR_CLEANUP_SECRET
  const isGdprCleanup = pathname === '/api/gdpr-cleanup'
  const hasGdprToken = isGdprCleanup && request.headers.get('authorization')?.startsWith('Bearer ')

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/invite/') ||
    pathname === '/api/health' ||
    pathname === '/api/contact' ||
    hasGdprToken // Only allow gdpr-cleanup if it has Bearer token

  // ========================================================================
  // M-01: CSP Nonce Generation
  // Generate a cryptographic nonce for each request to enable strict CSP
  // ========================================================================
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // Build CSP header with nonce - removes unsafe-inline
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sentry.io",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://*.supabase.co",
    "upgrade-insecure-requests",
  ].join('; ')

  if (isPublicRoute) {
    // For public routes, still set CSP but skip auth
    const publicResponse = NextResponse.next()
    publicResponse.headers.set('Content-Security-Policy', cspHeader)
    publicResponse.headers.set('x-nonce', nonce)
    return publicResponse
  }

  // Create response that will be returned (may be modified with cookies)
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Set CSP and nonce headers on all responses
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('x-nonce', nonce)

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.headers.set('Content-Security-Policy', cspHeader)
          response.headers.set('x-nonce', nonce)
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.headers.set('Content-Security-Policy', cspHeader)
          response.headers.set('x-nonce', nonce)
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session if exists (important for SSR)
  const { data: { user } } = await supabase.auth.getUser()

  // Protected route patterns (platform routes)
  const isProtectedRoute =
    pathname.startsWith('/instructions') ||
    pathname.startsWith('/portal') ||
    pathname.startsWith('/deviations') ||
    pathname.startsWith('/post-auth')

  // API routes that need auth (exclude public endpoints)
  const isProtectedApi =
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/health')

  // Redirect unauthenticated users from protected routes
  if (!user && isProtectedApi) {
    return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
  }

  if (!user && isProtectedRoute) {
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
