'use client'

import {
  AlertTriangle,
  FileText,
  MessageCircle,
  Zap,
  Clock,
  Inbox
} from 'lucide-react'
import type { Alert, Instruction } from '@/lib/types'
import { severityLabel, severityColor } from '@/lib/ui-helpers'

type Props = {
  alerts: Alert[]
  instructions: Instruction[]
  criticalInstructions: Instruction[]
  isMobile: boolean
  onTabChange: (tab: 'instructions' | 'ask') => void
  onSelectInstruction: (instruction: Instruction) => void
  setSearchQuery: (query: string) => void
}

export default function HomeContent({
  alerts,
  instructions,
  criticalInstructions,
  isMobile,
  onTabChange,
  onSelectInstruction,
  setSearchQuery
}: Props) {
  return (
    <>
      {alerts.length > 0 && (
        <div style={{ marginBottom: 'var(--space-7)' }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            letterSpacing: '-0.01em'
          }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-warning-600)' }} aria-hidden="true" />
            Aktive varsler
          </h2>
          {alerts.map(alert => {
            const sev = severityColor(alert.severity)
            return (
              <div
                key={alert.id}
                style={{
                  display: 'flex',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-5)',
                  marginBottom: 'var(--space-3)',
                  background: alert.severity === 'critical'
                    ? 'linear-gradient(135deg, var(--color-danger-50), var(--color-danger-100))'
                    : 'linear-gradient(135deg, var(--color-warning-50), var(--color-warning-100))',
                  border: `2px solid ${alert.severity === 'critical' ? 'var(--color-danger-200)' : 'var(--color-warning-200)'}`,
                  borderRadius: 'var(--radius-lg)'
                }}
              >
                <AlertTriangle size={20} style={{ color: sev.color, flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <div style={{ flex: 1 }}>
                  <span
                    className="nt-badge"
                    style={{
                      background: sev.bg,
                      color: sev.color
                    }}
                  >
                    {severityLabel(alert.severity)}
                  </span>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginTop: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    {alert.title}
                  </div>
                  {alert.description && (
                    <div style={{ fontSize: '0.8125rem', marginTop: 'var(--space-2)', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                      {alert.description}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-7)'
      }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-6)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--shadow-sm)'
          }}
          onClick={() => onTabChange('instructions')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary-700)'
          }}>
            <FileText size={26} aria-hidden="true" />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Instrukser</span>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-6)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--shadow-sm)'
          }}
          onClick={() => onTabChange('ask')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #E0E7FF, #C7D2FE)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#4F46E5'
          }}>
            <MessageCircle size={26} aria-hidden="true" />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Spør Tetra</span>
        </div>
        {!isMobile && criticalInstructions.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-6)',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onClick={() => { onTabChange('instructions'); setSearchQuery('') }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-accent-100), var(--color-accent-200))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-700)'
            }}>
              <Zap size={26} aria-hidden="true" />
            </div>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              {criticalInstructions.length} Kritiske
            </span>
          </div>
        )}
      </div>

      {criticalInstructions.length > 0 && (
        <div style={{ marginBottom: 'var(--space-7)' }}>
          <h2 style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-4)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            letterSpacing: '-0.01em'
          }}>
            <Zap size={18} style={{ color: 'var(--color-danger-600)' }} aria-hidden="true" />
            Kritiske instrukser
          </h2>
          <div className="nt-card">
            {criticalInstructions.slice(0, 3).map(inst => (
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
                  background: 'var(--color-danger-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-danger-700)',
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
        </div>
      )}

      <div>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          letterSpacing: '-0.01em'
        }}>
          <Clock size={18} style={{ color: 'var(--text-tertiary)' }} aria-hidden="true" />
          Siste instrukser
        </h2>
        {instructions.length === 0 ? (
          <div className="nt-empty-state">
            <Inbox className="nt-empty-state__icon" />
            <h3 className="nt-empty-state__title">Ingen instrukser tilgjengelig</h3>
            <p className="nt-empty-state__description">
              Det er ingen instrukser tildelt deg for øyeblikket. Instrukser vil vises her når de blir publisert.
            </p>
          </div>
        ) : (
          <div className="nt-card">
            {instructions.slice(0, 5).map(inst => (
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
      </div>
    </>
  )
}
