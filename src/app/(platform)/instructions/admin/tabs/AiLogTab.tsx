import { AlertTriangle, Paperclip, Bot } from 'lucide-react'
import type { AiLog } from '@/lib/types'

type Props = {
  aiLogs: AiLog[]
}

export default function AiLogTab({ aiLogs }: Props) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold font-serif tracking-tight text-foreground">
          AI-logg
        </h1>
        <p className="text-muted-foreground">
          Oversikt over spørsmål til Spør Tetrivo
        </p>
      </div>

      <div className="bg-[var(--warning-soft)] border border-[var(--warning-border)] rounded-2xl p-5 mb-6">
        <p className="m-0 text-[0.9375rem] text-[var(--warning)] flex items-start gap-2 mb-2">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong>Viktig:</strong> AI-assistenten svarer kun basert på publiserte instrukser.</span>
        </p>
        <p className="m-0 text-[0.9375rem] text-muted-foreground">
          Alle spørsmål og svar logges for kvalitetssikring og etterlevelse.
        </p>
      </div>

      {aiLogs.length === 0 ? (
        <div className="nt-empty-state">
          <Bot className="nt-empty-state__icon" />
          <h3 className="nt-empty-state__title">Ingen AI-spørsmål ennå</h3>
          <p className="nt-empty-state__description">
            {`Når ansatte begynner å bruke "Spør Tetrivo" funksjonen, vil spørsmål og svar vises her.`}
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
