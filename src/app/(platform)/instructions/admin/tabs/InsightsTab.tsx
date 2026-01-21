import { Bot, FileText } from 'lucide-react'
import type { UnansweredQuestion, Instruction } from '@/lib/types'

type Props = {
  unansweredQuestions: UnansweredQuestion[]
  instructions: Instruction[]
}

export default function InsightsTab({ unansweredQuestions, instructions }: Props) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold font-serif tracking-tight text-foreground">
          Innsikt
        </h1>
        <p className="text-muted-foreground">
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
              Ubesvarte spørsmål
            </h3>
          </div>
          <div className="nt-stat-card__value" style={{ marginBottom: 8 }}>
            {unansweredQuestions.length}
          </div>
          <div className="nt-stat-card__label">
            Spørsmål uten svar i systemet
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
