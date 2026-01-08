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

    // Get all instructions and their read confirmations
    const { data: instructions, error: instError } = await supabase
      .from('instructions')
      .select(`
        id,
        title,
        status,
        created_at
      `)
      .eq('org_id', profile.org_id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (instError) throw instError

    // Get all users in org
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('org_id', profile.org_id)
      .neq('role', 'admin') // Exclude admins from read tracking

    if (usersError) throw usersError

    // Get all read confirmations
    const { data: reads, error: readsError } = await supabase
      .from('instruction_reads')
      .select('*')
      .eq('org_id', profile.org_id)

    if (readsError) throw readsError

    // Build response with read status for each user-instruction pair
    const report = instructions?.map(instruction => {
      const instructionReads = reads?.filter(r => r.instruction_id === instruction.id) || []

      const userReadStatus = users?.map(user => {
        const userRead = instructionReads.find(r => r.user_id === user.id)
        return {
          user_id: user.id,
          user_name: user.full_name,
          user_email: user.email,
          read: !!userRead,
          confirmed: userRead?.confirmed || false,
          read_at: userRead?.read_at || null,
          confirmed_at: userRead?.confirmed_at || null
        }
      })

      const totalUsers = users?.length || 0
      const readCount = instructionReads.length
      const confirmedCount = instructionReads.filter(r => r.confirmed).length

      return {
        instruction_id: instruction.id,
        instruction_title: instruction.title,
        created_at: instruction.created_at,
        total_users: totalUsers,
        read_count: readCount,
        confirmed_count: confirmedCount,
        read_percentage: totalUsers > 0 ? (readCount / totalUsers * 100).toFixed(1) : 0,
        confirmed_percentage: totalUsers > 0 ? (confirmedCount / totalUsers * 100).toFixed(1) : 0,
        user_statuses: userReadStatus
      }
    })

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Read confirmations API error:', error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}
