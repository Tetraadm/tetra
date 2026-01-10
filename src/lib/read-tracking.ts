import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Log that a user has opened/viewed an instruction (passive tracking)
 * Uses UPSERT to handle duplicate reads gracefully
 */
export async function trackInstructionRead(
  supabase: SupabaseClient,
  instructionId: string,
  userId: string,
  orgId: string
): Promise<void> {
  try {
    // Use upsert to create or update existing record
    await supabase
      .from('instruction_reads')
      .upsert(
        {
          instruction_id: instructionId,
          user_id: userId,
          org_id: orgId,
          read_at: new Date().toISOString()
        },
        {
          onConflict: 'instruction_id,user_id',
          ignoreDuplicates: false // Update read_at even if record exists
        }
      )
  } catch (error) {
    console.error('Failed to track instruction read:', error)
  }
}

/**
 * Confirm that a user has read and understood an instruction (explicit confirmation)
 */
export async function confirmInstructionRead(
  supabase: SupabaseClient,
  instructionId: string,
  userId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('instruction_reads')
      .upsert(
        {
          instruction_id: instructionId,
          user_id: userId,
          org_id: orgId,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          read_at: new Date().toISOString() // Also update read_at
        },
        {
          onConflict: 'instruction_id,user_id'
        }
      )

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Failed to confirm instruction read:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

