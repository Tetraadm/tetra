import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GDPR Data Export API
 * 
 * GET - User exports all their personal data (Article 20 - Data Portability)
 * Returns JSON with all user-related data from the database.
 */
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
        }

        // Get user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (!profile) {
            return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 404 })
        }

        // Get user's read confirmations
        const { data: readConfirmations } = await supabase
            .from('instruction_reads')
            .select(`
                id,
                confirmed_at,
                instruction:instructions(id, title)
            `)
            .eq('user_id', user.id)
            .order('confirmed_at', { ascending: false })

        // Get user's AI questions (if any)
        const { data: aiQuestions } = await supabase
            .from('ask_tetra_logs')
            .select('id, question, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        // Get user's GDPR requests
        const { data: gdprRequests } = await supabase
            .from('gdpr_requests')
            .select('id, status, reason, created_at, processed_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        // Build export object
        const exportData = {
            exportedAt: new Date().toISOString(),
            exportFormat: 'GDPR Article 20 Compliant',
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.created_at,
                lastSignIn: user.last_sign_in_at,
            },
            profile: profile ? {
                fullName: profile.full_name,
                email: profile.email,
                role: profile.role,
                teamId: profile.team_id,
                organizationId: profile.org_id,
                pictureUrl: profile.picture_url,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
            } : null,
            readConfirmations: readConfirmations?.map(rc => {
                // Supabase returns single object for 1:1 relations
                const instruction = rc.instruction as unknown as { id: string; title: string } | null
                return {
                    instructionId: instruction?.id,
                    instructionTitle: instruction?.title,
                    confirmedAt: rc.confirmed_at,
                }
            }) || [],
            aiQuestions: aiQuestions?.map(q => ({
                question: q.question,
                askedAt: q.created_at,
            })) || [],
            gdprRequests: gdprRequests?.map(r => ({
                status: r.status,
                reason: r.reason,
                requestedAt: r.created_at,
                processedAt: r.processed_at,
            })) || [],
            metadata: {
                totalReadConfirmations: readConfirmations?.length || 0,
                totalAiQuestions: aiQuestions?.length || 0,
                totalGdprRequests: gdprRequests?.length || 0,
            }
        }

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="tetrivo-data-export-${new Date().toISOString().split('T')[0]}.json"`,
            },
        })

    } catch (error) {
        console.error('GDPR export error:', error)
        return NextResponse.json({ error: 'Kunne ikke eksportere data' }, { status: 500 })
    }
}
