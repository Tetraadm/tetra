import { useId, type Dispatch, type SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { Team, type Role } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
    const teamValue = inviteTeam || 'none'

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-foreground mb-6"
            >
                Lag invitasjonslenke
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-email`}>E-post (kun for referanse)</Label>
                    <Input
                        id={`${titleId}-email`}
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="bruker@bedrift.no"
                    />
                    <p className="text-xs text-muted-foreground">
                        E-posten lagres i revisjonsloggen for sporbarhet.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Rolle</Label>
                    <Select
                        value={inviteRole}
                        onValueChange={(value) => setInviteRole(value as Role)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="employee">Ansatt</SelectItem>
                            <SelectItem value="teamleader">Teamleder</SelectItem>
                            <SelectItem value="admin">Sikkerhetsansvarlig</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Team</Label>
                    <Select
                        value={teamValue}
                        onValueChange={(value) =>
                            setInviteTeam(value === 'none' ? '' : value)
                        }
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Velg team..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Ingen team</SelectItem>
                            {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Avbryt
                    </Button>
                    <Button onClick={inviteUser} disabled={userLoading}>
                        {userLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {userLoading ? 'Sender...' : 'Opprett invitasjon'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}
