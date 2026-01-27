import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * GDPR Cleanup API
 * POST /api/gdpr-cleanup
 * 
 * Triggers the cleanup of old logs for GDPR compliance.
 * This endpoint is protected by a secret token and should only be called
 * by scheduled jobs (e.g., GitHub Actions cron).
 * 
 * Required headers:
 * - Authorization: Bearer <GDPR_CLEANUP_SECRET>
 */
export async function POST(request: Request) {
    try {
        // Verify secret token
        const authHeader = request.headers.get('authorization')
        const expectedToken = process.env.GDPR_CLEANUP_SECRET

        if (!expectedToken) {
            console.error('GDPR_CLEANUP_SECRET not configured')
            return NextResponse.json(
                { error: 'Service not configured' },
                { status: 503 }
            )
        }

        if (authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Create admin client with service role
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json(
                { error: 'Supabase not configured' },
                { status: 503 }
            )
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey)

        // Retention period in days (default 90)
        const retentionDays = parseInt(process.env.GDPR_RETENTION_DAYS || '90', 10)

        // Call the cleanup function
        const { data, error } = await supabase.rpc('cleanup_all_old_logs', {
            retention_days: retentionDays
        })

        if (error) {
            console.error('GDPR cleanup failed:', error)
            return NextResponse.json(
                { error: 'Cleanup failed', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            retention_days: retentionDays,
            result: data,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        console.error('GDPR cleanup error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
