import { HelpCircle, Bot } from 'lucide-react'
import type { UnansweredQuestion } from '@/lib/types'

type Props = {
  unansweredQuestions: UnansweredQuestion[]
}

export default function UnansweredQuestionsTab({ unansweredQuestions }: Props) {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold font-serif tracking-tight text-foreground">
          Ubesvarte spørsmål
        </h1>
        <p className="text-muted-foreground">
          Spørsmål som AI ikke kunne besvare basert på eksisterende instrukser
        </p>
      </div>

      <div className="bg-[var(--warning-soft)] border border-[var(--warning-border)] rounded-2xl p-5 mb-6">
        <p className="m-0 text-[0.9375rem] text-[var(--warning)] flex items-start gap-2 mb-2">
          <HelpCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span><strong>Tips:</strong> Bruk disse spørsmålene til å identifisere manglende instrukser.</span>
        </p>
        <p className="m-0 text-[0.9375rem] text-muted-foreground">
          Når ansatte stiller spørsmål som AI ikke finner svar på, betyr det at det mangler relevant dokumentasjon.
        </p>
      </div>

      {unansweredQuestions.length === 0 ? (
        <div className="nt-empty-state">
          <Bot className="nt-empty-state__icon" />
          <h3 className="nt-empty-state__title">Ingen ubesvarte spørsmål</h3>
          <p className="nt-empty-state__description">
            Alle spørsmål har blitt besvart av AI. Bra jobba med dokumentasjonen!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {unansweredQuestions.map(q => (
            <div key={q.id} className="nt-card">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 12,
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)'
              }}>
                <span>{q.profiles?.full_name || 'Ukjent bruker'}</span>
                <span>
                  {new Date(q.created_at).toLocaleString('nb-NO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <p style={{
                fontWeight: 500,
                fontSize: '1rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                margin: 0
              }}>
                {q.question}
              </p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
