import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Returns system health status for monitoring tools.
 * Checks: Database connectivity, basic app functionality.
 */
export async function GET() {
    const startTime = Date.now()

    const checks: Record<string, { status: 'ok' | 'error'; ms?: number; error?: string }> = {}

    // Database health check
    try {
        const dbStart = Date.now()
        const supabase = await createClient()
        const { error } = await supabase.from('organizations').select('id').limit(1)

        if (error) throw error

        checks.database = { status: 'ok', ms: Date.now() - dbStart }
    } catch (err) {
        checks.database = {
            status: 'error',
            error: err instanceof Error ? err.message : 'Database connection failed'
        }
    }

    // Calculate overall status
    const allOk = Object.values(checks).every(c => c.status === 'ok')
    const totalMs = Date.now() - startTime

    const response = {
        status: allOk ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '0.1.0',
        uptime: process.uptime(),
        checks,
        responseTime: totalMs
    }

    return NextResponse.json(response, {
        status: allOk ? 200 : 503,
        headers: {
            'Cache-Control': 'no-store, max-age=0'
        }
    })
}
