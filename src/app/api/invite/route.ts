import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { inviteRatelimit } from '@/lib/ratelimit'
import { generateInviteHtml } from '@/lib/emails/invite-email'

// Initialize Resend with API Key
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : null

export async function POST(request: Request) {
    try {
        const json = await request.json()
        const { email, role, team_id } = json

        if (!email || !role) {
            return NextResponse.json(
                { error: 'Mangler påkrevde felt (email, role)' },
                { status: 400 }
            )
        }

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

        // 1. Auth & Permission Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, org_id, full_name')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json(
                { error: 'Kun administratorer kan invitere nye brukere' },
                { status: 403 }
            )
        }

        // 2. Rate Limiting
        const identifier = user.id
        const { success, isMisconfigured } = await inviteRatelimit.limit(identifier)

        // Fail-closed: if rate limiter is misconfigured in prod, return 503
        if (isMisconfigured) {
            console.error('INVITE_FATAL: Rate limiter misconfigured (Upstash not configured in production)')
            return NextResponse.json(
                { error: 'Tjenesten er midlertidig utilgjengelig. Prøv igjen senere.' },
                { status: 503 }
            )
        }

        if (!success) {
            return NextResponse.json(
                { error: 'For mange invitasjoner. Prøv igjen senere.' },
                { status: 429 }
            )
        }

        // 3. Validate team belongs to admin's org (security check)
        if (team_id) {
            const { data: teamCheck, error: teamError } = await supabase
                .from('teams')
                .select('id')
                .eq('id', team_id)
                .eq('org_id', profile.org_id)
                .single()

            if (teamError || !teamCheck) {
                return NextResponse.json(
                    { error: 'Ugyldig team - teamet tilhører ikke din organisasjon' },
                    { status: 400 }
                )
            }
        }

        // 4. Create Invite in DB
        const { data: invite, error: insertError } = await supabase
            .from('invites')
            .insert({
                role,
                team_id: team_id || null,
                org_id: profile.org_id
            })
            .select()
            .single()

        if (insertError) {
            console.error('Invite insert failed:', insertError)
            return NextResponse.json(
                { error: 'Kunne ikke opprette invitasjon' },
                { status: 500 }
            )
        }

        // 5. Send Email via Resend
        const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'
        const inviteUrl = `${origin}/invite/${invite.token}`
        let emailSent = false

        if (resend) {
            try {
                const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tetra HMS <onboarding@resend.dev>'

                // Construct inviter name
                const inviterName = profile.full_name || 'En administrator';

                // Generate HTML content
                console.log('Generating email for:', email, 'Inviter:', inviterName);
                const emailHtml = generateInviteHtml(inviteUrl, role, inviterName);

                // Safety check
                if (typeof emailHtml !== 'string' || !emailHtml.startsWith('<!DOCTYPE html>')) {
                    console.error('CRITICAL: Email HTML is not a valid string!', emailHtml);
                    throw new Error('Email HTML generation failed');
                }

                await resend.emails.send({
                    from: fromEmail,
                    to: email,
                    subject: 'Du har blitt invitert til Tetra HMS',
                    html: emailHtml
                })
                emailSent = true
            } catch (emailError) {
                console.error('Resend failed:', emailError)
                // We continue - invite is created, user can copy link manually explicitly in UI
            }
        } else {
            console.warn('Resend not configured')
        }

        // 6. Audit Log (Server-side insert)
        await supabase.from('audit_logs').insert({
            org_id: profile.org_id,
            user_id: user.id,
            action_type: 'invite_user',
            entity_type: 'invite',
            entity_id: invite.id,
            details: {
                invited_email: email,
                invited_role: role,
                email_sent: emailSent
            }
        })

        return NextResponse.json({
            success: true,
            inviteUrl,
            emailSent
        })

    } catch (error) {
        console.error('Invite API Error:', error)
        return NextResponse.json(
            { error: 'Intern serverfeil' },
            { status: 500 }
        )
    }
}
