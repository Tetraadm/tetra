import { useId } from 'react'
import { Loader2 } from 'lucide-react'
import { Team, Alert } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveSelect } from '@/components/ui/responsive-select'
import { Textarea } from '@/components/ui/textarea'
import { ModalShell } from './ModalShell'

type EditAlertModalProps = {
    open: boolean
    editingAlert: Alert | null
    editAlertTitle: string
    setEditAlertTitle: (value: string) => void
    editAlertDescription: string
    setEditAlertDescription: (value: string) => void
    editAlertSeverity: string
    setEditAlertSeverity: (value: string) => void
    editAlertTeams: string[]
    setEditAlertTeams: (value: string[]) => void
    editAlertAllTeams: boolean
    setEditAlertAllTeams: (value: boolean) => void
    teams: Team[]
    alertLoading: boolean
    saveEditAlert: () => void
    onClose: () => void
}

export function EditAlertModal({
    open,
    editingAlert,
    editAlertTitle,
    setEditAlertTitle,
    editAlertDescription,
    setEditAlertDescription,
    editAlertSeverity,
    setEditAlertSeverity,
    editAlertTeams,
    setEditAlertTeams,
    editAlertAllTeams,
    setEditAlertAllTeams,
    teams,
    alertLoading,
    saveEditAlert,
    onClose
}: EditAlertModalProps) {
    const titleId = useId()

    if (!editingAlert) return null

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-foreground mb-6"
            >
                Rediger kunngjøring
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-title`}>Tittel</Label>
                    <Input
                        id={`${titleId}-title`}
                        value={editAlertTitle}
                        onChange={(e) => setEditAlertTitle(e.target.value)}
                        placeholder="F.eks. Viktig melding til alle ansatte"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-description`}>Beskrivelse</Label>
                    <Textarea
                        id={`${titleId}-description`}
                        value={editAlertDescription}
                        onChange={(e) => setEditAlertDescription(e.target.value)}
                        rows={4}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Alvorlighet</Label>
                    <ResponsiveSelect
                        value={editAlertSeverity}
                        onValueChange={(value) => setEditAlertSeverity(value)}
                        options={[
                            { value: 'critical', label: 'Kritisk' },
                            { value: 'medium', label: 'Middels' },
                            { value: 'low', label: 'Lav' },
                        ]}
                        className="w-full"
                    />
                </div>

                <div className="space-y-3">
                    <Label>Synlig for</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox
                            checked={editAlertAllTeams}
                            onCheckedChange={(checked) => {
                                setEditAlertAllTeams(checked === true)
                                if (checked === true) {
                                    setEditAlertTeams([])
                                }
                            }}
                            id={`${titleId}-all-teams`}
                        />
                        <Label
                            htmlFor={`${titleId}-all-teams`}
                            className="text-sm text-muted-foreground"
                        >
                            Alle team
                        </Label>
                    </div>
                    {!editAlertAllTeams && (
                        <div className="flex flex-wrap gap-2">
                            {teams.map((team) => {
                                const isSelected = editAlertTeams.includes(team.id)
                                return (
                                    <button
                                        key={team.id}
                                        type="button"
                                        onClick={() => {
                                            const ids = isSelected
                                                ? editAlertTeams.filter((id) => id !== team.id)
                                                : [...editAlertTeams, team.id]
                                            setEditAlertTeams(ids)
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
                    <Button onClick={saveEditAlert} disabled={alertLoading}>
                        {alertLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {alertLoading ? 'Lagrer...' : 'Lagre'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}
