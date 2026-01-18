import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, org_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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

    return NextResponse.json({
      logs: data,
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
