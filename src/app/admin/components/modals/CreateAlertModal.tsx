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
                style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    marginBottom: 'var(--space-5)',
                    color: 'var(--text-primary)',
                }}
            >
                Opprett avvik
            </h2>

            <label className="nt-label">Tittel</label>
            <input
                className="nt-input"
                value={newAlert.title}
                onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                placeholder="F.eks. Stengt nødutgang"
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
            <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-3)',
                }}>
                    <input
                        type="checkbox"
                        checked={newAlert.allTeams}
                        onChange={(e) => setNewAlert({ ...newAlert, allTeams: e.target.checked, teamIds: [] })}
                        style={{
                            width: '16px',
                            height: '16px',
                            cursor: 'pointer',
                        }}
                    />
                    <span>Alle team</span>
                </label>
                {!newAlert.allTeams && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
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
