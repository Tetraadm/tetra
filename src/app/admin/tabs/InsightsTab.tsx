import { Bot, FileText } from 'lucide-react'
import type { AiLog, Instruction } from '@/lib/types'

type Props = {
  aiLogs: AiLog[]
  instructions: Instruction[]
}

export default function InsightsTab({ aiLogs, instructions }: Props) {
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
          Innsikt
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)'
        }}>
          Statistikk og analyse
        </p>
      </div>

      <div className="nt-grid-2">
        <div className="nt-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-600)'
            }}>
              <Bot size={24} />
            </div>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              AI-bruk
            </h3>
          </div>
          <div className="nt-stat-card__value" style={{ marginBottom: 8 }}>
            {aiLogs.length}
          </div>
          <div className="nt-stat-card__label">
            Totalt antall spørsmål
          </div>
        </div>

        <div className="nt-card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-accent-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-700)'
            }}>
              <FileText size={24} />
            </div>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              Dokumenter
            </h3>
          </div>
          <div className="nt-stat-card__value" style={{ marginBottom: 8 }}>
            {instructions.filter(i => i.status === 'published').length}
          </div>
          <div className="nt-stat-card__label">
            Publiserte instrukser
          </div>
        </div>
      </div>
    </>
  )
}
