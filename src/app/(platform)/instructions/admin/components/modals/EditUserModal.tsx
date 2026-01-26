import { useId, type Dispatch, type SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { Team, type Profile, type Role } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ResponsiveSelect } from '@/components/ui/responsive-select'
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
                className="text-xl font-semibold tracking-tight text-foreground mb-2"
            >
                Rediger bruker
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                {editingUser.full_name}
            </p>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Rolle</Label>
                    <ResponsiveSelect
                        value={editUserRole}
                        onValueChange={(value) => setEditUserRole(value as Role)}
                        options={[
                            { value: 'employee', label: 'Ansatt' },
                            { value: 'teamleader', label: 'Teamleder' },
                            { value: 'admin', label: 'Sikkerhetsansvarlig' },
                        ]}
                        className="w-full"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Team</Label>
                    <ResponsiveSelect
                        value={editUserTeam || 'none'}
                        onValueChange={(value) =>
                            setEditUserTeam(value === 'none' ? '' : value)
                        }
                        options={[
                            { value: 'none', label: 'Ingen team' },
                            ...teams.map((team) => ({
                                value: team.id,
                                label: team.name,
                            })),
                        ]}
                        className="w-full"
                    />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Avbryt
                    </Button>
                    <Button onClick={saveEditUser} disabled={userLoading}>
                        {userLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {userLoading ? 'Lagrer...' : 'Lagre'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}
