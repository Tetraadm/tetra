import { useId } from 'react'
import { ModalShell } from './ModalShell'

type DisclaimerModalProps = {
    open: boolean
    onClose: () => void
}

export function DisclaimerModal({ open, onClose }: DisclaimerModalProps) {
    const titleId = useId()

    if (!open) return null

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    marginBottom: 'var(--space-5)',
                    color: 'var(--text-primary)',
                }}
            >
                Om AI-assistenten
            </h2>

            <div
                style={{
                    background: 'linear-gradient(135deg, var(--color-warning-50), var(--color-warning-100))',
                    border: '2px solid var(--color-warning-200)',
                    borderLeft: '4px solid var(--color-warning-600)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-4)',
                    marginBottom: 'var(--space-6)',
                }}
            >
                <h3 style={{
                    fontWeight: 600,
                    marginBottom: 'var(--space-2)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9375rem',
                }}>
                    Ansvarsfraskrivelse
                </h3>
                <p style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-3)',
                    color: 'var(--text-secondary)',
                }}>
                    Tetrivo AI er et <strong>støtteverktøy</strong> som hjelper ansatte med å finne informasjon i bedriftens instrukser og prosedyrer.
                </p>
                <p style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-3)',
                    color: 'var(--text-secondary)',
                }}>
                    AI-assistenten svarer <strong>kun basert på publiserte dokumenter</strong> i systemet. Den bruker ikke ekstern kunnskap eller generell informasjon.
                </p>
                <p style={{
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: 'var(--color-warning-800)',
                }}>
                    <strong>Viktig:</strong> AI-svar er ikke juridisk bindende eller operativ fasit. Ved tvil, kontakt alltid ansvarlig leder.
                </p>
            </div>

            <h3 style={{
                fontWeight: 600,
                marginBottom: 'var(--space-2)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
            }}>
                Logging
            </h3>
            <p style={{
                fontSize: '0.875rem',
                lineHeight: 1.6,
                marginBottom: 'var(--space-5)',
                color: 'var(--text-secondary)',
            }}>
                Alle spørsmål og svar logges for kvalitetssikring. Loggene er kun tilgjengelige for administratorer.
            </p>

            <button className="nt-btn nt-btn-primary" onClick={onClose} style={{ width: '100%' }}>
                Lukk
            </button>
        </ModalShell>
    )
}
