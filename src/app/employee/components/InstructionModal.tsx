'use client'

import { X, CheckCircle } from 'lucide-react'
import type { Instruction } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { severityLabel, severityColor } from '@/lib/ui-helpers'
import FileLink from '@/components/FileLink'

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
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1, paddingRight: 'var(--space-4)' }}>
            <span
              className="nt-badge"
              style={{
                background: severityColor(instruction.severity).bg,
                color: severityColor(instruction.severity).color
              }}
            >
              {severityLabel(instruction.severity)}
            </span>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              marginTop: 'var(--space-3)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              lineHeight: 1.3
            }}>
              {instruction.title}
            </h2>
          </div>
          <button
            style={{
              width: 36,
              height: 36,
              border: 'none',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              flexShrink: 0,
              transition: 'all var(--transition-fast)'
            }}
            onClick={onClose}
            aria-label="Lukk"
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--color-danger-100)'
              e.currentTarget.style.color = 'var(--color-danger-700)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-6)'
        }}>
          {instruction.content && (
            <div style={{
              fontSize: '0.9375rem',
              lineHeight: 1.75,
              whiteSpace: 'pre-wrap',
              marginBottom: 'var(--space-5)',
              color: 'var(--text-secondary)'
            }}>
              {instruction.content}
            </div>
          )}
          {instruction.file_path && <FileLink fileUrl={instruction.file_path} supabase={supabase} />}
          {!instruction.content && !instruction.file_path && (
            <p style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
              Ingen beskrivelse tilgjengelig.
            </p>
          )}
          <div style={{
            marginTop: 'var(--space-7)',
            paddingTop: 'var(--space-5)',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            {isConfirmed ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'linear-gradient(135deg, var(--color-success-50), var(--color-success-100))',
                border: '2px solid var(--color-success-200)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-success-800)',
                fontSize: '0.875rem',
                fontWeight: 500
              }}>
                <CheckCircle size={20} aria-hidden="true" />
                Du har bekreftet at du har lest og forstått denne instruksen
              </div>
            ) : (
              <button
                className="nt-btn nt-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => onConfirmRead(instruction.id)}
                disabled={isConfirming}
              >
                {isConfirming ? (
                  <>
                    <div className="spinner spinner-sm spinner-white" />
                    Bekrefter...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} aria-hidden="true" />
                    Jeg har lest og forstått
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
