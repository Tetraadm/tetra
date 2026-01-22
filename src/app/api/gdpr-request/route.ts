import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/sanitize-html'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Schema for creating a deletion request
const createRequestSchema = z.object({
    reason: z.string().max(1000).optional()
})

// Schema for updating a request (admin)
const updateRequestSchema = z.object({
    requestId: z.string().uuid(),
    status: z.enum(['approved', 'rejected']),
    adminNotes: z.string().max(1000).optional()
})

/**
 * GDPR Deletion Request API
 * 
 * POST - User creates deletion request
 * GET  - User/Admin views requests
 * PATCH - Admin approves/rejects request
 */

// POST: User creates a deletion request
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
        }

        const body = await request.json()
        const validation = createRequestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Ugyldig input', details: validation.error.flatten() },
                { status: 400 }
            )
        }

        // Get user's profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, full_name, email')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 404 })
        }

        // Check for existing pending request
        const { data: existingRequest } = await supabase
            .from('gdpr_requests')
            .select('id, status')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .single()

        if (existingRequest) {
            return NextResponse.json(
                { error: 'Du har allerede en ventende forespørsel' },
                { status: 409 }
            )
        }

        // Create the request
        const { data: newRequest, error: insertError } = await supabase
            .from('gdpr_requests')
            .insert({
                user_id: user.id,
                org_id: profile.org_id,
                reason: validation.data.reason || null
            })
            .select()
            .single()

        if (insertError) {
            console.error('GDPR request insert error:', insertError)
            return NextResponse.json(
                { error: 'Kunne ikke opprette forespørsel' },
                { status: 500 }
            )
        }

        // Notify admins via email
        if (resend) {
            try {
                // Get org admins
                const { data: admins } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('org_id', profile.org_id)
                    .eq('role', 'admin')

                if (admins && admins.length > 0) {
                    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[]

                    if (adminEmails.length > 0) {
                        await resend.emails.send({
                            from: process.env.RESEND_FROM_EMAIL || 'Tetrivo HMS <no-reply@tetrivo.com>',
                            to: adminEmails,
                            subject: 'GDPR: Ny sletteforespørsel',
                            html: `
                                <!DOCTYPE html>
                                <html>
                                <body style="font-family: sans-serif; padding: 20px;">
                                    <h2>Ny GDPR sletteforespørsel</h2>
                                    <p>En bruker har bedt om sletting av sin konto:</p>
                                    <ul>
                                        <li><strong>Bruker:</strong> ${escapeHtml(profile.full_name || 'Ukjent')}</li>
                                        <li><strong>E-post:</strong> ${escapeHtml(profile.email || 'Ukjent')}</li>
                                        ${validation.data.reason ? `<li><strong>Begrunnelse:</strong> ${escapeHtml(validation.data.reason)}</li>` : ''}
                                    </ul>
                                    <p>Logg inn på admin-panelet for å behandle forespørselen.</p>
                                    <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/instructions/admin">Gå til admin-panel</a></p>
                                </body>
                                </html>
                            `
                        })
                    }
                }
            } catch (emailError) {
                console.error('Failed to send admin notification:', emailError)
                // Continue - request was created successfully
            }
        }

        return NextResponse.json({
            success: true,
            request: newRequest,
            message: 'Forespørselen din er mottatt. En administrator vil behandle den.'
        })

    } catch (error) {
        console.error('GDPR request POST error:', error)
        return NextResponse.json({ error: 'Intern serverfeil' }, { status: 500 })
    }
}

// GET: View requests
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, org_id')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 404 })
        }

        // If admin, get all org requests; otherwise just user's own
        let query = supabase
            .from('gdpr_requests')
            .select(`
                *,
                user:profiles!gdpr_requests_user_id_fkey(id, full_name, email),
                processed_by_user:profiles!gdpr_requests_processed_by_fkey(full_name)
            `)
            .order('created_at', { ascending: false })

        if (profile.role === 'admin') {
            query = query.eq('org_id', profile.org_id)
        } else {
            query = query.eq('user_id', user.id)
        }

        const { data: requests, error } = await query

        if (error) {
            console.error('GDPR request GET error:', error)
            return NextResponse.json({ error: 'Kunne ikke hente forespørsler' }, { status: 500 })
        }

        return NextResponse.json({ requests })

    } catch (error) {
        console.error('GDPR request GET error:', error)
        return NextResponse.json({ error: 'Intern serverfeil' }, { status: 500 })
    }
}

// PATCH: Admin approves/rejects request
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
        }

        const body = await request.json()
        const validation = updateRequestSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Ugyldig input', details: validation.error.flatten() },
                { status: 400 }
            )
        }

        // Verify admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, org_id')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json({ error: 'Kun administratorer kan behandle forespørsler' }, { status: 403 })
        }

        const { requestId, status, adminNotes } = validation.data

        // Update the request
        const { data: updatedRequest, error: updateError } = await supabase
            .from('gdpr_requests')
            .update({
                status,
                admin_notes: adminNotes || null,
                processed_by: user.id,
                processed_at: new Date().toISOString()
            })
            .eq('id', requestId)
            .eq('org_id', profile.org_id) // Security: only own org
            .select()
            .single()

        if (updateError) {
            console.error('GDPR request update error:', updateError)
            return NextResponse.json({ error: 'Kunne ikke oppdatere forespørsel' }, { status: 500 })
        }

        // If approved, process the deletion
        if (status === 'approved') {
            const { data: deletionResult, error: deletionError } = await supabase
                .rpc('process_gdpr_deletion_request', { p_request_id: requestId })

            if (deletionError) {
                console.error('GDPR deletion error:', deletionError)
                return NextResponse.json({
                    success: false,
                    error: 'Forespørsel godkjent, men sletting feilet. Kontakt systemadministrator.',
                    details: deletionError.message
                }, { status: 500 })
            }

            return NextResponse.json({
                success: true,
                message: 'Bruker er slettet',
                request: updatedRequest,
                deletionResult
            })
        }

        return NextResponse.json({
            success: true,
            message: status === 'rejected' ? 'Forespørsel avslått' : 'Forespørsel oppdatert',
            request: updatedRequest
        })

    } catch (error) {
        console.error('GDPR request PATCH error:', error)
        return NextResponse.json({ error: 'Intern serverfeil' }, { status: 500 })
    }
}
