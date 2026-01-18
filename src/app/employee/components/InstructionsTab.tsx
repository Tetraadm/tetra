'use client'

import { Search, FileText } from 'lucide-react'
import type { Instruction } from '@/lib/types'
import { severityLabel, severityColor } from '@/lib/ui-helpers'

type Props = {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredInstructions: Instruction[]
  onSelectInstruction: (instruction: Instruction) => void
}

export default function InstructionsTab({
  searchQuery,
  setSearchQuery,
  filteredInstructions,
  onSelectInstruction
}: Props) {
  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        padding: 'var(--space-3) var(--space-4)',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--space-5)'
      }}>
        <Search size={20} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} aria-hidden="true" />
        <input
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)'
          }}
          placeholder="Søk i instrukser..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      {filteredInstructions.length === 0 ? (
        <div className="nt-empty-state">
          <FileText className="nt-empty-state__icon" />
          <h3 className="nt-empty-state__title">
            {searchQuery ? 'Ingen treff' : 'Ingen instrukser tilgjengelig'}
          </h3>
          <p className="nt-empty-state__description">
            {searchQuery
              ? 'Prøv å søke med et annet nøkkelord eller fjern søket for å se alle instrukser.'
              : 'Det er ingen instrukser tildelt deg for øyeblikket.'}
          </p>
          {searchQuery && (
            <button className="nt-btn nt-btn-secondary" onClick={() => setSearchQuery('')}>
              Fjern søk
            </button>
          )}
        </div>
      ) : (
        <div className="nt-card">
          {filteredInstructions.map(inst => (
            <div
              key={inst.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                borderBottom: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)'
              }}
              onClick={() => onSelectInstruction(inst)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-primary-100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-700)',
                flexShrink: 0
              }}>
                <FileText size={20} aria-hidden="true" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                  {inst.title}
                </div>
                <span
                  className="nt-badge"
                  style={{
                    background: severityColor(inst.severity).bg,
                    color: severityColor(inst.severity).color
                  }}
                >
                  {severityLabel(inst.severity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
