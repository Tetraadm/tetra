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
      return NextResponse.json({ error: 'Ikke autentisert' }, { status: 401 })
    }

    const body = await request.json()
    const validation = confirmReadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: 'Ugyldig input' }, { status: 400 })
    }

    const { instructionId } = validation.data

    // Validate instruction access via team-scoped RPC (not just org)
    // This ensures users can only confirm reads for instructions they have access to
    const { data: accessibleInstructions, error: accessError } = await supabase
      .rpc('get_user_instructions', { p_user_id: user.id })

    if (accessError) {
      console.error('CONFIRM_READ: get_user_instructions failed', accessError)
      return NextResponse.json({ error: 'Kunne ikke verifisere tilgang' }, { status: 500 })
    }

    // Check if the requested instruction is in the user's accessible list
    const hasAccess = accessibleInstructions?.some(
      (inst: { id: string }) => inst.id === instructionId
    )

    if (!hasAccess) {
      return NextResponse.json({ error: 'Ingen tilgang til denne instruksen' }, { status: 403 })
    }

    // Get org_id from the matched instruction
    const matchedInstruction = accessibleInstructions?.find(
      (inst: { id: string; org_id: string }) => inst.id === instructionId
    )

    // Confirm the read
    const { error } = await supabase
      .from('instruction_reads')
      .upsert(
        {
          instruction_id: instructionId,
          user_id: user.id,
          org_id: matchedInstruction?.org_id,
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
