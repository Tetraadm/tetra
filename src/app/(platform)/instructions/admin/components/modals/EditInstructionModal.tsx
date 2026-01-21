import { useId, type Dispatch, type SetStateAction } from 'react'
import { Folder, Instruction, Team } from '@/lib/types'
import { ModalShell } from './ModalShell'

type EditInstructionModalProps = {
    open: boolean
    folders: Folder[]
    teams: Team[]
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
    editInstructionTeams: string[]
    setEditInstructionTeams: Dispatch<SetStateAction<string[]>>
    instructionLoading: boolean
    saveEditInstruction: () => void
    onClose: () => void
}

export function EditInstructionModal({
    open,
    folders,
    teams,
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
    editInstructionTeams,
    setEditInstructionTeams,
    instructionLoading,
    saveEditInstruction,
    onClose
}: EditInstructionModalProps) {
    const titleId = useId()

    const toggleTeam = (teamId: string) => {
        setEditInstructionTeams(prev =>
            prev.includes(teamId)
                ? prev.filter(id => id !== teamId)
                : [...prev, teamId]
        )
    }

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

            <label className="nt-label">Team</label>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                maxHeight: '150px',
                overflowY: 'auto'
            }}>
                {teams.length === 0 ? (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Ingen team opprettet</span>
                ) : (
                    teams.map((team) => (
                        <label key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={editInstructionTeams.includes(team.id)}
                                onChange={() => toggleTeam(team.id)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{team.name}</span>
                        </label>
                    ))
                )}
            </div>

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
