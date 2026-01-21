import { useId, type Dispatch, type SetStateAction } from 'react'
import { ModalShell } from './ModalShell'

type CreateFolderModalProps = {
    open: boolean
    newFolderName: string
    setNewFolderName: Dispatch<SetStateAction<string>>
    onCreate: () => void
    onClose: () => void
    loading: boolean
}

export function CreateFolderModal({
    open,
    newFolderName,
    setNewFolderName,
    onCreate,
    onClose,
    loading
}: CreateFolderModalProps) {
    const titleId = useId()

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                className="text-xl font-semibold font-serif tracking-tight text-foreground mb-6"
            >
                Opprett mappe
            </h2>
            <label className="nt-label">Mappenavn</label>
            <input
                className="nt-input"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="F.eks. Brann, HMS"
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
