import { useId, type Dispatch, type SetStateAction } from 'react'
import { Team, type Profile, type Role } from '@/lib/types'
import { ModalShell } from './ModalShell'

type EditUserModalProps = {
    open: boolean
    editingUser: Profile | null
    editUserRole: Role
    setEditUserRole: Dispatch<SetStateAction<Role>>
    editUserTeam: string
    setEditUserTeam: Dispatch<SetStateAction<string>>
    teams: Team[]
    userLoading: boolean
    saveEditUser: () => void
    onClose: () => void
}

export function EditUserModal({
    open,
    editingUser,
    editUserRole,
    setEditUserRole,
    editUserTeam,
    setEditUserTeam,
    teams,
    userLoading,
    saveEditUser,
    onClose
}: EditUserModalProps) {
    const titleId = useId()

    if (!open || !editingUser) return null

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                className="text-xl font-semibold font-serif tracking-tight text-foreground mb-2"
            >
                Rediger bruker
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                {editingUser.full_name}
            </p>

            <label className="nt-label">Rolle</label>
            <select
                className="nt-select"
                value={editUserRole}
                onChange={(e) => setEditUserRole(e.target.value as Role)}
            >
                <option value="employee">Ansatt</option>
                <option value="teamleader">Teamleder</option>
                <option value="admin">Sikkerhetsansvarlig</option>
            </select>

            <label className="nt-label">Team</label>
            <select
                className="nt-select"
                value={editUserTeam}
                onChange={(e) => setEditUserTeam(e.target.value)}
            >
                <option value="">Ingen team</option>
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
                    onClick={saveEditUser}
                    disabled={userLoading}
                >
                    {userLoading ? (
                        <>
                            <div className="spinner spinner-sm spinner-white" />
                            Lagrer...
                        </>
                    ) : (
                        'Lagre'
                    )}
                </button>
            </div>
        </ModalShell>
    )
}
