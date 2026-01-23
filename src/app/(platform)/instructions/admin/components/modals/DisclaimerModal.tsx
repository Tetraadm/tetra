import { useId } from 'react'
import { Button } from '@/components/ui/button'
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
                className="text-xl font-semibold tracking-tight text-foreground mb-6"
            >
                Om AI-assistenten
            </h2>

            <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                    Ansvarsfraskrivelse
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    Tetrivo AI er et <strong>støtteverktøy</strong> som hjelper ansatte med å finne informasjon i bedriftens instrukser og prosedyrer.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    AI-assistenten svarer <strong>kun basert på publiserte dokumenter</strong> i systemet. Den bruker ikke ekstern kunnskap eller generell informasjon.
                </p>
                <p className="text-sm leading-relaxed text-warning">
                    <strong>Viktig:</strong> AI-svar er ikke juridisk bindende eller operativ fasit. Ved tvil, kontakt alltid ansvarlig leder.
                </p>
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-2">Logging</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Alle spørsmål og svar logges for kvalitetssikring. Loggene er kun tilgjengelige for administratorer.
            </p>

            <Button className="w-full" onClick={onClose}>
                Lukk
            </Button>
        </ModalShell>
    )
}
