import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'
import { getGoogleAuthOptions } from '@/lib/vertex-auth'

// GCS bucket - required, no default to prevent accidental prod writes
function getGcsBucketName(): string {
  const bucket = process.env.GCS_BUCKET_NAME
  if (!bucket) {
    throw new Error('GCS_BUCKET_NAME environment variable is required')
  }
  return bucket
}

/**
 * GDPR Cleanup API
 * POST /api/gdpr-cleanup
 * 
 * Triggers the cleanup of old logs for GDPR compliance.
 * Also cleans up GCS files for soft-deleted instructions.
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

        // Call the cleanup function for logs
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

        // Clean up GCS files for soft-deleted instructions older than retention period
        const gcsCleanupResult = { deleted: 0, errors: 0 }
        try {
            const cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

            // Find instructions that were soft-deleted more than retentionDays ago
            const { data: deletedInstructions, error: fetchError } = await supabase
                .from('instructions')
                .select('id, file_path')
                .not('deleted_at', 'is', null)
                .lt('deleted_at', cutoffDate.toISOString())
                .not('file_path', 'is', null)

            if (fetchError) {
                console.error('Failed to fetch deleted instructions:', fetchError)
            } else if (deletedInstructions && deletedInstructions.length > 0) {
                const storage = new Storage({
                    ...getGoogleAuthOptions(),
                    projectId: getGoogleAuthOptions().projectId
                })
                const bucket = storage.bucket(getGcsBucketName())

                for (const instruction of deletedInstructions) {
                    if (instruction.file_path) {
                        try {
                            await bucket.file(instruction.file_path).delete()
                            gcsCleanupResult.deleted++
                            console.log(`[GDPR_CLEANUP] Deleted GCS file: ${instruction.file_path}`)
                        } catch (gcsError) {
                            // File might not exist in GCS - that's ok
                            console.warn(`[GDPR_CLEANUP] Failed to delete GCS file: ${instruction.file_path}`, gcsError)
                            gcsCleanupResult.errors++
                        }
                    }
                }

                // Also delete from Supabase Storage
                const filePaths = deletedInstructions
                    .filter(i => i.file_path)
                    .map(i => i.file_path as string)

                if (filePaths.length > 0) {
                    const { error: storageError } = await supabase.storage
                        .from('instructions')
                        .remove(filePaths)

                    if (storageError) {
                        console.warn('[GDPR_CLEANUP] Supabase storage cleanup warning:', storageError)
                    }
                }

                // Hard delete the instruction records now that files are cleaned up
                const { error: hardDeleteError } = await supabase
                    .from('instructions')
                    .delete()
                    .in('id', deletedInstructions.map(i => i.id))

                if (hardDeleteError) {
                    console.error('[GDPR_CLEANUP] Failed to hard delete instructions:', hardDeleteError)
                }
            }
        } catch (gcsCleanupError) {
            console.error('GCS cleanup error:', gcsCleanupError)
            // Continue - GCS cleanup is not critical for the API response
        }

        return NextResponse.json({
            success: true,
            retention_days: retentionDays,
            result: data,
            gcs_cleanup: gcsCleanupResult,
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
