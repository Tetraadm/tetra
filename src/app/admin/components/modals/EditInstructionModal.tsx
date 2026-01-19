import { useId, type Dispatch, type SetStateAction } from 'react'
import { Folder, Instruction } from '@/lib/types'
import { ModalShell } from './ModalShell'

type EditInstructionModalProps = {
    open: boolean
    folders: Folder[]
    editingInstruction: Instruction | null
    editInstructionTitle: string
    setEditInstructionTitle: Dispatch<SetStateAction<string>>
    editInstructionContent: string
    setEditInstructionContent: Dispatch<SetStateAction<string>>
    editInstructionSeverity: string
    setEditInstructionSeverity: Dispatch<SetStateAction<string>>
    editInstructionStatus: string
    setEditInstructionStatus: Dispatch<SetStateAction<string>>
    editInstructionFolder: string
    setEditInstructionFolder: Dispatch<SetStateAction<string>>
    instructionLoading: boolean
    saveEditInstruction: () => void
    onClose: () => void
}

export function EditInstructionModal({
    open,
    folders,
    editingInstruction,
    editInstructionTitle,
    setEditInstructionTitle,
    editInstructionContent,
    setEditInstructionContent,
    editInstructionSeverity,
    setEditInstructionSeverity,
    editInstructionStatus,
    setEditInstructionStatus,
    editInstructionFolder,
    setEditInstructionFolder,
    instructionLoading,
    saveEditInstruction,
    onClose
}: EditInstructionModalProps) {
    const titleId = useId()

    if (!open || !editingInstruction) return null

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
                Rediger instruks
            </h2>

            <label className="nt-label">Tittel</label>
            <input
                className="nt-input"
                value={editInstructionTitle}
                onChange={(e) => setEditInstructionTitle(e.target.value)}
            />

            <label className="nt-label">Mappe</label>
            <select
                className="nt-select"
                value={editInstructionFolder}
                onChange={(e) => setEditInstructionFolder(e.target.value)}
            >
                <option value="">Ingen mappe</option>
                {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
            </select>

            <label className="nt-label">Status</label>
            <select
                className="nt-select"
                value={editInstructionStatus}
                onChange={(e) => setEditInstructionStatus(e.target.value)}
            >
                <option value="draft">Utkast</option>
                <option value="published">Publisert</option>
            </select>

            <label className="nt-label">Innhold</label>
            <textarea
                className="nt-textarea"
                value={editInstructionContent}
                onChange={(e) => setEditInstructionContent(e.target.value)}
                rows={8}
            />

            <label className="nt-label">Alvorlighet</label>
            <select
                className="nt-select"
                value={editInstructionSeverity}
                onChange={(e) => setEditInstructionSeverity(e.target.value)}
            >
                <option value="critical">Kritisk</option>
                <option value="medium">Middels</option>
                <option value="low">Lav</option>
            </select>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="nt-btn nt-btn-secondary" onClick={onClose}>
                    Avbryt
                </button>
                <button
                    className="nt-btn nt-btn-primary"
                    onClick={saveEditInstruction}
                    disabled={instructionLoading}
                >
                    {instructionLoading ? (
                        <>
                            <div className="spinner spinner-sm spinner-white" />
                            Lagrer...
                        </>
                    ) : (
                        'Lagre'
                    )}
                </button>
            </div>
        </ModalShell>
    )
}
