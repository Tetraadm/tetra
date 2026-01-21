import { useId, type Dispatch, type SetStateAction } from 'react'
import { Team } from '@/lib/types'
import type { NewAlertState } from '../../hooks/useAdminAlerts'
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
                className="text-xl font-semibold font-serif tracking-tight text-foreground mb-6"
            >
                Opprett kunngjøring
            </h2>

            <label className="nt-label">Tittel</label>
            <input
                className="nt-input"
                value={newAlert.title}
                onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                placeholder="F.eks. Viktig melding til alle ansatte"
            />

            <label className="nt-label">Beskrivelse</label>
            <textarea
                className="nt-textarea"
                value={newAlert.description}
                onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
                rows={4}
            />

            <label className="nt-label">Alvorlighet</label>
            <select
                className="nt-select"
                value={newAlert.severity}
                onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
            >
                <option value="critical">Kritisk</option>
                <option value="medium">Middels</option>
                <option value="low">Lav</option>
            </select>

            <label className="nt-label">Synlig for</label>
            <div className="mb-4">
                <label className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={newAlert.allTeams}
                        onChange={(e) => setNewAlert({ ...newAlert, allTeams: e.target.checked, teamIds: [] })}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Alle team</span>
                </label>
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

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="nt-btn nt-btn-secondary" onClick={onClose}>
                    Avbryt
                </button>
                <button
                    className="nt-btn nt-btn-primary"
                    onClick={createAlert}
                    disabled={alertLoading}
                >
                    {alertLoading ? (
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
