import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiRatelimit } from '@/lib/ratelimit'

// Types for RPC responses
type InstructionReadStats = {
  instruction_id: string
  instruction_title: string
  instruction_created_at: string
  total_users: number
  read_count: number
  confirmed_count: number
  read_percentage: number
  confirmed_percentage: number
}

type UserReadStatus = {
  user_id: string
  user_name: string
  user_email: string
  has_read: boolean
  confirmed: boolean
  read_at: string | null
  confirmed_at: string | null
}

export async function GET(request: NextRequest) {
  try {
    // Use regular client for auth
    const supabase = await createClient()
    // Use service-role client for RPC calls (only GRANTed to service_role)
    const supabaseAdmin = createServiceRoleClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    // Rate limiting
    const { success, isMisconfigured } = await apiRatelimit.limit(`read-confirmations:${user.id}`)
    if (isMisconfigured) {
      return NextResponse.json({ error: 'Tjenesten er midlertidig utilgjengelig' }, { status: 503 })
    }
    if (!success) {
      return NextResponse.json({ error: 'For mange forespørsler. Prøv igjen senere.' }, { status: 429 })
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Ingen tilgang' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const instructionId = searchParams.get('instruction_id')

    // If instruction_id is provided, return user-level read status for that instruction
    if (instructionId) {
      const { data: userReads, error: userReadsError } = await supabaseAdmin
        .rpc('get_instruction_user_reads', {
          p_instruction_id: instructionId,
          p_org_id: profile.org_id,
          p_limit: limit,
          p_offset: offset
        }) as { data: UserReadStatus[] | null, error: unknown }

      if (userReadsError) {
        console.error('get_instruction_user_reads error:', userReadsError)
        return NextResponse.json({ error: 'Kunne ikke hente brukerdata' }, { status: 500 })
      }

      return NextResponse.json({
        user_reads: userReads || [],
        pagination: { limit, offset }
      })
    }

    // Otherwise, return aggregated instruction stats
    const { data: stats, error: statsError } = await supabaseAdmin
      .rpc('get_instruction_read_stats', {
        p_org_id: profile.org_id,
        p_limit: limit,
        p_offset: offset
      }) as { data: InstructionReadStats[] | null, error: unknown }

    if (statsError) {
      console.error('get_instruction_read_stats error:', statsError)
      return NextResponse.json({ error: 'Kunne ikke hente statistikk' }, { status: 500 })
    }

    // Get total count for pagination
    const { data: totalCount, error: countError } = await supabaseAdmin
      .rpc('count_org_instructions', { p_org_id: profile.org_id })

    if (countError) {
      console.error('count_org_instructions error:', countError)
    }

    return NextResponse.json({
      report: stats || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Read confirmations API error:', error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}
