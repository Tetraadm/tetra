import { useId, type Dispatch, type SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { Folder, Team } from '@/lib/types'
import type { NewInstructionState } from '../../hooks/useAdminInstructions'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
                    <Select
                        value={newInstruction.folderId || 'none'}
                        onValueChange={(value) =>
                            setNewInstruction({
                                ...newInstruction,
                                folderId: value === 'none' ? '' : value,
                            })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Ingen mappe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Ingen mappe</SelectItem>
                            {folders.map((folder) => (
                                <SelectItem key={folder.id} value={folder.id}>
                                    {folder.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                        value={newInstruction.status}
                        onValueChange={(value) =>
                            setNewInstruction({ ...newInstruction, status: value })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Utkast (ikke synlig for ansatte)</SelectItem>
                            <SelectItem value="published">Publisert (synlig for ansatte og AI)</SelectItem>
                        </SelectContent>
                    </Select>
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
                    <Select
                        value={newInstruction.severity}
                        onValueChange={(value) =>
                            setNewInstruction({ ...newInstruction, severity: value })
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="critical">Kritisk</SelectItem>
                            <SelectItem value="medium">Middels</SelectItem>
                            <SelectItem value="low">Lav</SelectItem>
                        </SelectContent>
                    </Select>
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
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Avbryt
                    </Button>
                    <Button onClick={createInstruction} disabled={instructionLoading}>
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
