'use client'

import { X, CheckCircle } from 'lucide-react'
import type { Instruction } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { severityLabel } from '@/lib/ui-helpers'
import FileLink from '@/components/FileLink'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Props = {
  instruction: Instruction | null
  onClose: () => void
  isConfirmed: boolean
  isConfirming: boolean
  onConfirmRead: (instructionId: string) => void
  supabase: SupabaseClient
}

export default function InstructionModal({
  instruction,
  onClose,
  isConfirmed,
  isConfirming,
  onConfirmRead,
  supabase
}: Props) {
  if (!instruction) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[700px] max-h-[90vh] bg-card rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b flex justify-between items-start bg-card">
          <div className="flex-1 pr-4">
            <Badge variant={instruction.severity === 'critical' ? 'destructive' : 'secondary'}>
              {severityLabel(instruction.severity)}
            </Badge>
            <h2 className="text-xl font-semibold font-serif mt-3 tracking-tight text-foreground leading-tight">
              {instruction.title}
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Lukk"
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {instruction.content ? (
            <div className="text-[0.9375rem] leading-relaxed whitespace-pre-wrap mb-5 text-card-foreground/90">
              {instruction.content}
            </div>
          ) : !instruction.file_path && (
            <p className="italic text-muted-foreground">
              Ingen beskrivelse tilgjengelig.
            </p>
          )}

          {instruction.file_path && <FileLink fileUrl={instruction.file_path} supabase={supabase} />}

          <div className="mt-8 pt-5 border-t">
            {isConfirmed ? (
              <div className="flex items-center gap-3 p-4 bg-[var(--success-soft)] border border-[var(--success-border)] rounded-md text-[var(--success)] text-sm font-medium">
                <CheckCircle size={20} className="text-[var(--success)]" />
                Du har bekreftet at du har lest og forstått denne instruksen
              </div>
            ) : (
              <Button
                className="w-full justify-center gap-2"
                onClick={() => onConfirmRead(instruction.id)}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Bekrefter...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Jeg har lest og forstått
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
