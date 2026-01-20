import { AlertTriangle, Paperclip, Bot } from 'lucide-react'
import type { AiLog } from '@/lib/types'

type Props = {
  aiLogs: AiLog[]
}

export default function AiLogTab({ aiLogs }: Props) {
  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.02em'
        }}>
          AI-logg
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)'
        }}>
          Oversikt over spørsmål til Spør Tetra
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-primary-100))',
        border: '2px solid var(--color-primary-200)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        marginBottom: 'var(--space-6)'
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.9375rem',
          color: 'var(--color-primary-800)',
          display: 'flex',
          alignItems: 'start',
          gap: 8,
          marginBottom: 8
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
          <strong>Viktig:</strong> AI-assistenten svarer kun basert på publiserte instrukser.
        </p>
        <p style={{
          margin: 0,
          fontSize: '0.9375rem',
          color: 'var(--color-primary-700)'
        }}>
          Alle spørsmål og svar logges for kvalitetssikring og compliance.
        </p>
      </div>

      {aiLogs.length === 0 ? (
        <div className="nt-empty-state">
          <Bot className="nt-empty-state__icon" />
          <h3 className="nt-empty-state__title">Ingen AI-spørsmål ennå</h3>
          <p className="nt-empty-state__description">
            {`Når ansatte begynner å bruke "Spør Tetra" funksjonen, vil spørsmål og svar vises her.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {aiLogs.map(log => (
            <div key={log.id} className="nt-card">
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: 12,
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)'
              }}>
                {new Date(log.created_at).toLocaleString('nb-NO', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8
                }}>
                  Spørsmål
                </div>
                <p style={{
                  fontWeight: 500,
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6
                }}>
                  {log.question}
                </p>
              </div>

              <div style={{ marginBottom: log.instructions ? 16 : 0 }}>
                <div style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8
                }}>
                  Svar
                </div>
                <p style={{
                  fontSize: '0.9375rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  {log.answer}
                </p>
              </div>

              {log.instructions && (
                <div style={{
                  background: 'var(--color-primary-50)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--color-primary-800)'
                }}>
                  <Paperclip size={14} aria-hidden="true" />
                  <strong>Kilde:</strong> {log.instructions.title}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
