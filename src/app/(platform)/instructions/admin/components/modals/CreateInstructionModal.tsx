import { useId, type Dispatch, type SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { Folder, Team } from '@/lib/types'
import type { NewInstructionState } from '../../hooks/useAdminInstructions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveSelect } from '@/components/ui/responsive-select'
import { Textarea } from '@/components/ui/textarea'
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
    const hasTeamSelection = newInstruction.allTeams || newInstruction.teamIds.length > 0
    const canCreate = newInstruction.title.trim().length > 0 && hasTeamSelection

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-foreground mb-6"
            >
                Opprett instruks
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-title`}>Tittel</Label>
                    <Input
                        id={`${titleId}-title`}
                        value={newInstruction.title}
                        onChange={(e) => setNewInstruction({ ...newInstruction, title: e.target.value })}
                        placeholder="F.eks. Brannrutiner"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Mappe</Label>
                    <ResponsiveSelect
                        value={newInstruction.folderId || 'none'}
                        onValueChange={(value) =>
                            setNewInstruction({
                                ...newInstruction,
                                folderId: value === 'none' ? '' : value,
                            })
                        }
                        options={[
                            { value: 'none', label: 'Ingen mappe' },
                            ...folders.map((folder) => ({
                                value: folder.id,
                                label: folder.name,
                            })),
                        ]}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Status</Label>
                    <ResponsiveSelect
                        value={newInstruction.status}
                        onValueChange={(value) =>
                            setNewInstruction({ ...newInstruction, status: value })
                        }
                        options={[
                            { value: 'draft', label: 'Utkast (ikke synlig for ansatte)' },
                            { value: 'published', label: 'Publisert (synlig for ansatte og AI)' },
                        ]}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-content`}>
                        Innhold (brukes av AI)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Valgfritt hvis du laster opp PDF. AI kan kun svare basert på tekst du skriver her.
                    </p>
                    <Textarea
                        id={`${titleId}-content`}
                        value={newInstruction.content}
                        onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
                        placeholder="Skriv eller lim inn tekst fra PDF her for at AI skal kunne svare på spørsmål om denne instruksen..."
                        rows={8}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Alvorlighet</Label>
                    <ResponsiveSelect
                        value={newInstruction.severity}
                        onValueChange={(value) =>
                            setNewInstruction({ ...newInstruction, severity: value })
                        }
                        options={[
                            { value: 'critical', label: 'Kritisk' },
                            { value: 'medium', label: 'Middels' },
                            { value: 'low', label: 'Lav' },
                        ]}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-file`}>Vedlegg (PDF)</Label>
                    <Input
                        id={`${titleId}-file`}
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    {selectedFile && (
                        <p className="text-xs font-medium text-success">
                            Valgt fil: {selectedFile.name}
                        </p>
                    )}
                </div>

                <div className="space-y-3">
                    <Label>Team</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                            checked={newInstruction.allTeams}
                            onCheckedChange={(checked) =>
                                setNewInstruction({
                                    ...newInstruction,
                                    allTeams: checked === true,
                                    teamIds: [],
                                })
                            }
                            id={`${titleId}-all-teams`}
                        />
                        <Label
                            htmlFor={`${titleId}-all-teams`}
                            className="text-sm text-muted-foreground"
                        >
                            Alle team
                        </Label>
                    </div>
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
                    {!hasTeamSelection && (
                        <p className="text-xs text-destructive">
                            Velg minst ett team eller bruk Alle team.
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Avbryt
                    </Button>
                    <Button onClick={createInstruction} disabled={instructionLoading || !canCreate}>
                        {instructionLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {instructionLoading ? 'Oppretter...' : 'Opprett'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}
