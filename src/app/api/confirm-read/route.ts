import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const confirmReadSchema = z.object({
  instructionId: z.string().uuid()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = confirmReadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Ugyldig input' }, { status: 400 })
    }

    const { instructionId } = validation.data

    // Get user's org_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profil ikke funnet' }, { status: 404 })
    }

    // Validate instruction belongs to user's org
    const { data: instruction, error: instructionError } = await supabase
      .from('instructions')
      .select('id')
      .eq('id', instructionId)
      .eq('org_id', profile.org_id)
      .single()

    if (instructionError || !instruction) {
      return NextResponse.json({ error: 'Instruks ikke funnet' }, { status: 404 })
    }

    // Confirm the read
    const { error } = await supabase
      .from('instruction_reads')
      .upsert(
        {
          instruction_id: instructionId,
          user_id: user.id,
          org_id: profile.org_id,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          read_at: new Date().toISOString()
        },
        {
          onConflict: 'instruction_id,user_id'
        }
      )

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Confirm read API error:', error)
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 })
  }
}
