import { AlertTriangle, Paperclip } from 'lucide-react'
import type { AiLog } from '@/lib/types'
import type { createAdminStyles } from '../styles'

type Props = {
  aiLogs: AiLog[]
  styles: ReturnType<typeof createAdminStyles>
}

export default function AiLogTab({ aiLogs, styles }: Props) {
  return (
    <>
      <h1 style={styles.pageTitle}>AI-logg</h1>
      <p style={styles.pageSubtitle}>Oversikt over spørsmål til Spør Tetra</p>

      <div style={styles.disclaimer}>
        <p style={{ margin: 0 }}>
          <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} aria-hidden="true" />
            Viktig:
          </strong>{' '}
          AI-assistenten svarer kun basert på publiserte instrukser.
        </p>
        <p style={{ margin: 0 }}>
          Alle spørsmål og svar logges for kvalitetssikring og compliance.
        </p>
      </div>

      {aiLogs.length === 0 ? (
        <div style={styles.card}>
          <div style={styles.cardBody}>
            <p style={{ color: '#64748B' }}>Ingen AI-spørsmål ennå</p>
          </div>
        </div>
      ) : (
        aiLogs.map(log => (
          <div key={log.id} style={styles.logCard}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>
                {new Date(log.created_at).toLocaleString('nb-NO')}
              </span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Spørsmål:</span>
              <p style={{ fontWeight: 500 }}>{log.question}</p>
            </div>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Svar:</span>
              <p style={{ fontSize: 14, lineHeight: 1.5 }}>{log.answer}</p>
            </div>
            {log.instructions && (
              <div style={{
                background: '#EFF6FF',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 13
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Paperclip size={14} aria-hidden="true" />
                  Kilde: {log.instructions.title}
                </span>
              </div>
            )}
          </div>
        ))
      )}
    </>
  )
}
