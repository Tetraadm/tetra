import { useId, type Dispatch, type SetStateAction } from 'react'
import { Team, type Role } from '@/lib/types'
import { ModalShell } from './ModalShell'

type InviteUserModalProps = {
    open: boolean
    inviteEmail: string
    setInviteEmail: Dispatch<SetStateAction<string>>
    inviteRole: Role
    setInviteRole: Dispatch<SetStateAction<Role>>
    inviteTeam: string
    setInviteTeam: Dispatch<SetStateAction<string>>
    teams: Team[]
    userLoading: boolean
    inviteUser: () => void
    onClose: () => void
}

export function InviteUserModal({
    open,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteTeam,
    setInviteTeam,
    teams,
    userLoading,
    inviteUser,
    onClose
}: InviteUserModalProps) {
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
                Lag invitasjonslenke
            </h2>

            <label className="nt-label">E-post (kun for referanse)</label>
            <input
                className="nt-input"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="bruker@bedrift.no"
            />
            <p style={{
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)',
                marginTop: 'calc(var(--space-3) * -1)',
                marginBottom: 'var(--space-4)',
            }}>
                E-posten lagres ikke i databasen. Den brukes kun for logging og referanse.
            </p>

            <label className="nt-label">Rolle</label>
            <select
                className="nt-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
            >
                <option value="employee">Ansatt</option>
                <option value="teamleader">Teamleder</option>
                <option value="admin">Sikkerhetsansvarlig</option>
            </select>

            <label className="nt-label">Team</label>
            <select
                className="nt-select"
                value={inviteTeam}
                onChange={(e) => setInviteTeam(e.target.value)}
            >
                <option value="">Velg team...</option>
                {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                ))}
            </select>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button className="nt-btn nt-btn-secondary" onClick={onClose}>
                    Avbryt
                </button>
                <button
                    className="nt-btn nt-btn-primary"
                    onClick={inviteUser}
                    disabled={userLoading}
                >
                    {userLoading ? (
                        <>
                            <div className="spinner spinner-sm spinner-white" />
                            Sender...
                        </>
                    ) : (
                        'Opprett invitasjon'
                    )}
                </button>
            </div>
        </ModalShell>
    )
}
