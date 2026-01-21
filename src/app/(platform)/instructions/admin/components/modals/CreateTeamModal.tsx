import { useId, type Dispatch, type SetStateAction } from 'react'
import { ModalShell } from './ModalShell'

type CreateTeamModalProps = {
    open: boolean
    newTeamName: string
    setNewTeamName: Dispatch<SetStateAction<string>>
    onCreate: () => void
    onClose: () => void
    loading: boolean
}

export function CreateTeamModal({
    open,
    newTeamName,
    setNewTeamName,
    onCreate,
    onClose,
    loading
}: CreateTeamModalProps) {
    const titleId = useId()

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
                Opprett team
            </h2>
            <label className="nt-label">Teamnavn</label>
            <input
                className="nt-input"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="F.eks. Lager, Butikk"
            />
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="nt-btn nt-btn-secondary" onClick={onClose}>
                    Avbryt
                </button>
                <button
                    className="nt-btn nt-btn-primary"
                    onClick={onCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="spinner spinner-sm spinner-white" />
                            Oppretter...
                        </>
                    ) : (
                        'Opprett'
                    )}
                </button>
            </div>
        </ModalShell>
    )
}
