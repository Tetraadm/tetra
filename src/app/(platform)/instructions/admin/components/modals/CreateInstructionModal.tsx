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
                className="text-xl font-semibold font-serif tracking-tight text-foreground mb-6"
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
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
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
                className="mb-4 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary/70 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground hover:file:bg-secondary"
            />
            {selectedFile && (
                <p className="mb-4 text-xs font-semibold text-[var(--success)]">
                    Valgt fil: {selectedFile.name}
                </p>
            )}

            <label className="nt-label">Team</label>
            <div className="mb-4">
                <label className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={newInstruction.allTeams}
                        onChange={(e) => setNewInstruction({ ...newInstruction, allTeams: e.target.checked, teamIds: [] })}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Alle team</span>
                </label>
                {!newInstruction.allTeams && (
                    <div className="flex flex-wrap gap-2">
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
                                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                                        isSelected
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border/70 bg-card/70 text-muted-foreground hover:border-primary/40'
                                    }`}
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
