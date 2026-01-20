import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Server-side Audit Logging API
 * POST /api/audit
 * 
 * F-05 Fix: Moves audit logging from client-side to server-side for tamper resistance.
 * Client hooks should call this API instead of directly inserting into audit_logs.
 */

const auditSchema = z.object({
    actionType: z.enum([
        'create_instruction', 'update_instruction', 'publish_instruction',
        'unpublish_instruction', 'delete_instruction',
        'create_alert', 'update_alert', 'toggle_alert', 'delete_alert',
        'create_folder', 'delete_folder',
        'create_team', 'delete_team',
        'create_user', 'edit_user', 'delete_user', 'invite_user', 'change_role'
    ]),
    entityType: z.enum(['instruction', 'alert', 'folder', 'team', 'user', 'invite']),
    entityId: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional()
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const validation = auditSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Ugyldig input', details: validation.error.flatten() },
                { status: 400 }
            )
        }

        const { actionType, entityType, entityId, details } = validation.data

        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // Context is server component/route handler
                        }
                    },
                },
            }
        )

        // Verify authentication
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
        }

        // Get user profile to verify org membership
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('org_id, role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 403 })
        }

        // Server-side insert - user cannot manipulate org_id or user_id
        const { error: insertError } = await supabase
            .from('audit_logs')
            .insert({
                org_id: profile.org_id,    // Server-determined
                user_id: user.id,          // Server-determined
                action_type: actionType,
                entity_type: entityType,
                entity_id: entityId || null,
                details: details || {}
            })

        if (insertError) {
            console.error('AUDIT_INSERT_ERROR:', insertError)
            return NextResponse.json(
                { error: 'Kunne ikke logge hendelse' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('AUDIT_API_ERROR:', error)
        return NextResponse.json(
            { error: 'Intern serverfeil' },
            { status: 500 }
        )
    }
}
