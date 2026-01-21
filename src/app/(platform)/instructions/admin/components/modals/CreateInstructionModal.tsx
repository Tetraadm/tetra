import { useId, type Dispatch, type SetStateAction } from 'react'
import { Folder, Team } from '@/lib/types'
import type { NewInstructionState } from '../../hooks/useAdminInstructions'
import { ModalShell } from './ModalShell'

type CreateInstructionModalProps = {
    open: boolean
    folders: Folder[]
    teams: Team[]
    newInstruction: NewInstructionState
    selectedFile: File | null
    setNewInstruction: Dispatch<SetStateAction<NewInstructionState>>
    setSelectedFile: Dispatch<SetStateAction<File | null>>
    instructionLoading: boolean
    createInstruction: () => void
    onClose: () => void
}

export function CreateInstructionModal({
    open,
    folders,
    teams,
    newInstruction,
    selectedFile,
    setNewInstruction,
    setSelectedFile,
    instructionLoading,
    createInstruction,
    onClose
}: CreateInstructionModalProps) {
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
                Opprett instruks
            </h2>

            <label className="nt-label">Tittel</label>
            <input
                className="nt-input"
                value={newInstruction.title}
                onChange={(e) => setNewInstruction({ ...newInstruction, title: e.target.value })}
                placeholder="F.eks. Brannrutiner"
            />

            <label className="nt-label">Mappe</label>
            <select
                className="nt-select"
                value={newInstruction.folderId}
                onChange={(e) => setNewInstruction({ ...newInstruction, folderId: e.target.value })}
            >
                <option value="">Ingen mappe</option>
                {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
            </select>

            <label className="nt-label">Status</label>
            <select
                className="nt-select"
                value={newInstruction.status}
                onChange={(e) => setNewInstruction({ ...newInstruction, status: e.target.value })}
            >
                <option value="draft">Utkast (ikke synlig for ansatte)</option>
                <option value="published">Publisert (synlig for ansatte og AI)</option>
            </select>

            <label className="nt-label">
                Innhold (brukes av AI)
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 400,
                    color: 'var(--text-tertiary)',
                    marginLeft: 'var(--space-2)',
                }}>
                    Valgfritt hvis du laster opp PDF. AI kan kun svare basert på tekst du skriver her.
                </span>
            </label>
            <textarea
                className="nt-textarea"
                value={newInstruction.content}
                onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
                placeholder="Skriv eller lim inn tekst fra PDF her for at AI skal kunne svare på spørsmål om denne instruksen..."
                rows={8}
            />

            <label className="nt-label">Alvorlighet</label>
            <select
                className="nt-select"
                value={newInstruction.severity}
                onChange={(e) => setNewInstruction({ ...newInstruction, severity: e.target.value })}
            >
                <option value="critical">Kritisk</option>
                <option value="medium">Middels</option>
                <option value="low">Lav</option>
            </select>

            <label className="nt-label">Vedlegg (PDF)</label>
            <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                style={{
                    marginBottom: 'var(--space-4)',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                }}
            />
            {selectedFile && (
                <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-success-700)',
                    marginBottom: 'var(--space-4)',
                    fontWeight: 500,
                }}>
                    Valgt fil: {selectedFile.name}
                </p>
            )}

            <label className="nt-label">Team</label>
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-3)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                }}>
                    <input
                        type="checkbox"
                        checked={newInstruction.allTeams}
                        onChange={(e) => setNewInstruction({ ...newInstruction, allTeams: e.target.checked, teamIds: [] })}
                        style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                        }}
                    />
                    <span>Alle team</span>
                </label>
                {!newInstruction.allTeams && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                        {teams.map((team) => {
                            const isSelected = newInstruction.teamIds.includes(team.id)
                            return (
                                <button
                                    key={team.id}
                                    type="button"
                                    onClick={() => {
                                        const ids = isSelected
                                            ? newInstruction.teamIds.filter((id) => id !== team.id)
                                            : [...newInstruction.teamIds, team.id]
                                        setNewInstruction({ ...newInstruction, teamIds: ids })
                                    }}
                                    style={{
                                        padding: 'var(--space-2) var(--space-4)',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600,
                                        borderRadius: 'var(--radius-full)',
                                        border: isSelected
                                            ? '2px solid var(--color-primary-600)'
                                            : '1px solid var(--border-primary)',
                                        background: isSelected
                                            ? 'var(--color-primary-100)'
                                            : 'var(--bg-elevated)',
                                        color: isSelected
                                            ? 'var(--color-primary-700)'
                                            : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'var(--transition-fast)',
                                    }}
                                >
                                    {team.name}
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="nt-btn nt-btn-secondary" onClick={onClose}>
                    Avbryt
                </button>
                <button
                    className="nt-btn nt-btn-primary"
                    onClick={createInstruction}
                    disabled={instructionLoading}
                >
                    {instructionLoading ? (
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
