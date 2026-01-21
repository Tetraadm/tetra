import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { trackInstructionRead } from '@/lib/read-tracking'
import type { createClient } from '@/lib/supabase/client'
import type { Instruction, Profile } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

type UseEmployeeInstructionsOptions = {
  profile: Profile
  instructions: Instruction[]
  supabase: SupabaseClient
}

export function useEmployeeInstructions({ profile, instructions, supabase }: UseEmployeeInstructionsOptions) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null)
  const [confirmedInstructions, setConfirmedInstructions] = useState<Set<string>>(new Set())
  const [confirmingInstruction, setConfirmingInstruction] = useState<string | null>(null)

  useEffect(() => {
    const loadConfirmed = async () => {
      try {
        const { data, error } = await supabase
          .from('instruction_reads')
          .select('instruction_id')
          .eq('user_id', profile.id)
          .eq('confirmed', true)

        if (error) throw error

        if (data) {
          setConfirmedInstructions(new Set(data.map(r => r.instruction_id)))
        }
      } catch (error) {
        console.error('Load confirmed instructions error:', error)
      }
    }
    loadConfirmed()
  }, [profile.id, supabase])

  useEffect(() => {
    if (selectedInstruction) {
      trackInstructionRead(supabase, selectedInstruction.id, profile.id, profile.org_id)
    }
  }, [selectedInstruction, supabase, profile.id, profile.org_id])

  const filteredInstructions = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return instructions.filter(inst =>
      inst.title.toLowerCase().includes(query) ||
      (inst.content && inst.content.toLowerCase().includes(query))
    )
  }, [instructions, searchQuery])

  const criticalInstructions = useMemo(
    () => instructions.filter(i => i.severity === 'critical'),
    [instructions]
  )

  const handleConfirmRead = useCallback(async (instructionId: string) => {
    setConfirmingInstruction(instructionId)
    try {
      const response = await fetch('/api/confirm-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.success) {
        setConfirmedInstructions(prev => new Set(prev).add(instructionId))
        toast.success('Bekreftet! Du har lest og forstatt instruksen.')
      } else {
        throw new Error('Ugyldig respons fra server')
      }
    } catch (error) {
      console.error('Confirm read error:', error)
      toast.error('Kunne ikke bekrefte lesing. Prov igjen.')
    } finally {
      setConfirmingInstruction(null)
    }
  }, [])

  const selectInstructionById = useCallback((instructionId: string) => {
    const instruction = instructions.find(i => i.id === instructionId)
    if (instruction) {
      setSelectedInstruction(instruction)
    }
  }, [instructions])

  return {
    searchQuery,
    setSearchQuery,
    selectedInstruction,
    setSelectedInstruction,
    confirmedInstructions,
    confirmingInstruction,
    filteredInstructions,
    criticalInstructions,
    handleConfirmRead,
    selectInstructionById
  }
}
