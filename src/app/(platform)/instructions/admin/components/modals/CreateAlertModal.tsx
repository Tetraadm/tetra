import { useId, type Dispatch, type SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { Team } from '@/lib/types'
import type { NewAlertState } from '../../hooks/useAdminAlerts'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveSelect } from '@/components/ui/responsive-select'
import { Textarea } from '@/components/ui/textarea'
import { ModalShell } from './ModalShell'

type CreateAlertModalProps = {
    open: boolean
    newAlert: NewAlertState
    setNewAlert: Dispatch<SetStateAction<NewAlertState>>
    teams: Team[]
    alertLoading: boolean
    createAlert: () => void
    onClose: () => void
}

export function CreateAlertModal({
    open,
    newAlert,
    setNewAlert,
    teams,
    alertLoading,
    createAlert,
    onClose
}: CreateAlertModalProps) {
    const titleId = useId()

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-foreground mb-6"
            >
                Opprett kunngjøring
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-title`}>Tittel</Label>
                    <Input
                        id={`${titleId}-title`}
                        value={newAlert.title}
                        onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                        placeholder="F.eks. Viktig melding til alle ansatte"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-description`}>Beskrivelse</Label>
                    <Textarea
                        id={`${titleId}-description`}
                        value={newAlert.description}
                        onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                        rows={4}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Alvorlighet</Label>
                    <ResponsiveSelect
                        value={newAlert.severity}
                        onValueChange={(value) =>
                            setNewAlert({ ...newAlert, severity: value })
                        }
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
                            checked={newAlert.allTeams}
                            onCheckedChange={(checked) =>
                                setNewAlert({
                                    ...newAlert,
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
                    {!newAlert.allTeams && (
                        <div className="flex flex-wrap gap-2">
                            {teams.map((team) => {
                                const isSelected = newAlert.teamIds.includes(team.id)
                                return (
                                    <button
                                        key={team.id}
                                        type="button"
                                        onClick={() => {
                                            const ids = isSelected
                                                ? newAlert.teamIds.filter((id) => id !== team.id)
                                                : [...newAlert.teamIds, team.id]
                                            setNewAlert({ ...newAlert, teamIds: ids })
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
                    <Button onClick={createAlert} disabled={alertLoading}>
                        {alertLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {alertLoading ? 'Oppretter...' : 'Opprett'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}
