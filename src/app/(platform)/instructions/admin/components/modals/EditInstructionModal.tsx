import { useId, type Dispatch, type SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { Folder, Instruction, Team } from '@/lib/types'
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
                className="text-xl font-semibold tracking-tight text-foreground mb-6"
            >
                Rediger instruks
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-title`}>Tittel</Label>
                    <Input
                        id={`${titleId}-title`}
                        value={editInstructionTitle}
                        onChange={(e) => setEditInstructionTitle(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Mappe</Label>
                    <Select
                        value={editInstructionFolder || 'none'}
                        onValueChange={(value) =>
                            setEditInstructionFolder(value === 'none' ? '' : value)
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
                        value={editInstructionStatus}
                        onValueChange={(value) => setEditInstructionStatus(value)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Utkast</SelectItem>
                            <SelectItem value="published">Publisert</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-content`}>Innhold</Label>
                    <Textarea
                        id={`${titleId}-content`}
                        value={editInstructionContent}
                        onChange={(e) => setEditInstructionContent(e.target.value)}
                        rows={8}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Alvorlighet</Label>
                    <Select
                        value={editInstructionSeverity}
                        onValueChange={(value) => setEditInstructionSeverity(value)}
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
                    <Label>Team</Label>
                    <div className="flex max-h-[150px] flex-col gap-2 overflow-y-auto rounded-lg border border-border/70 bg-secondary/60 p-3">
                        {teams.length === 0 ? (
                            <span className="text-sm text-muted-foreground">Ingen team opprettet</span>
                        ) : (
                            teams.map((team) => (
                                <div key={team.id} className="flex items-center gap-2 text-sm text-foreground">
                                    <Checkbox
                                        checked={editInstructionTeams.includes(team.id)}
                                        onCheckedChange={() => toggleTeam(team.id)}
                                        id={`${titleId}-team-${team.id}`}
                                    />
                                    <Label htmlFor={`${titleId}-team-${team.id}`} className="text-sm">
                                        {team.name}
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Avbryt
                    </Button>
                    <Button onClick={saveEditInstruction} disabled={instructionLoading}>
                        {instructionLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {instructionLoading ? 'Lagrer...' : 'Lagre'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}
