import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiRatelimit } from '@/lib/ratelimit'

/**
 * Masks an email address for privacy (GDPR data minimization)
 * Example: "john.doe@example.com" -> "j***@e***.com"
 */
function maskEmail(email: string | null): string | null {
    if (!email) return null
    const [local, domain] = email.split('@')
    if (!domain) return email
    const [domainName, tld] = domain.split('.')
    if (!tld) return email
    return `${local[0]}***@${domainName[0]}***.${tld}`
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    // Rate limiting
    const { success, isMisconfigured } = await apiRatelimit.limit(`audit-logs:${user.id}`)
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

    // Get query parameters for filtering and pagination
    const searchParams = request.nextUrl.searchParams
    const actionType = searchParams.get('action_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with count for pagination
    let query = supabase
      .from('audit_logs')
      .select('*, profiles(full_name, email)', { count: 'exact' })
      .eq('org_id', profile.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (actionType && actionType !== 'all') {
      query = query.eq('action_type', actionType)
    }
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, count, error } = await query

    if (error) throw error

    // SECURITY: Mask emails in response (GDPR data minimization)
    const maskedLogs = (data || []).map((log: Record<string, unknown>) => {
      const profiles = log.profiles as { full_name?: string; email?: string } | null
      return {
        ...log,
        profiles: profiles ? {
          full_name: profiles.full_name,
          email: maskEmail(profiles.email || null)
        } : null
      }
    })

    return NextResponse.json({
      logs: maskedLogs,
      pagination: {
        total: count || 0,
        limit,
        offset
      }
    })
  } catch (error) {
    console.error('Audit logs API error:', error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}
