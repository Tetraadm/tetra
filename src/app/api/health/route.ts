import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getRateLimiterStatus } from '@/lib/ratelimit'

// Get version from package.json or environment
const SERVICE_VERSION = process.env.npm_package_version || process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0'

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Returns system health status for monitoring tools.
 * Checks: Database connectivity, rate limiter, external services.
 */
export async function GET() {
    const startTime = Date.now()

    const checks: Record<string, { status: 'ok' | 'error' | 'degraded'; ms?: number; error?: string; details?: Record<string, unknown> }> = {}

    // Database health check - use auth check that doesn't require RLS
    try {
        const dbStart = Date.now()
        const supabase = await createClient()
        // Check auth connection - this verifies Supabase connectivity without RLS
        const { error } = await supabase.auth.getSession()

        if (error) throw error

        checks.database = { status: 'ok', ms: Date.now() - dbStart }
    } catch (err) {
        checks.database = {
            status: 'error',
            error: err instanceof Error ? err.message : 'Database connection failed'
        }
    }

    // Rate limiter health check
    // SECURITY: Don't expose provider details - just status
    const rateLimiterStatus = getRateLimiterStatus()
    if (rateLimiterStatus.provider === 'misconfigured') {
        checks.rateLimiter = {
            status: 'error',
            error: 'Rate limiter not properly configured'
        }
    } else if (rateLimiterStatus.provider === 'in-memory') {
        checks.rateLimiter = {
            status: 'degraded',
            error: 'Using fallback rate limiter'
        }
    } else {
        checks.rateLimiter = {
            status: 'ok'
        }
    }

    // External services configuration check (not connectivity - just config presence)
    // SECURITY: Don't expose which specific services are missing - reduces attack surface
    const externalServices = {
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        resend: !!process.env.RESEND_API_KEY,
        sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
    }

    const configuredCount = Object.values(externalServices).filter(Boolean).length
    const totalServices = Object.keys(externalServices).length

    if (configuredCount < totalServices) {
        checks.externalServices = {
            status: 'degraded',
            error: 'One or more external services not configured'
            // SECURITY: Don't expose which services or details
        }
    } else {
        checks.externalServices = {
            status: 'ok'
            // SECURITY: Don't expose service names even when configured
        }
    }

    // Calculate overall status
    const hasError = Object.values(checks).some(c => c.status === 'error')
    const hasDegraded = Object.values(checks).some(c => c.status === 'degraded')
    const totalMs = Date.now() - startTime

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy'
    let httpStatus: number

    if (hasError) {
        overallStatus = 'unhealthy'
        httpStatus = 503
    } else if (hasDegraded) {
        overallStatus = 'degraded'
        httpStatus = 200 // Degraded is still operational
    } else {
        overallStatus = 'healthy'
        httpStatus = 200
    }

    const response = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: SERVICE_VERSION,
        uptime: process.uptime(),
        checks,
        responseTime: totalMs
    }

    return NextResponse.json(response, {
        status: httpStatus,
        headers: {
            'Cache-Control': 'no-store, max-age=0',
            'X-Service-Version': SERVICE_VERSION,
        }
    })
}

