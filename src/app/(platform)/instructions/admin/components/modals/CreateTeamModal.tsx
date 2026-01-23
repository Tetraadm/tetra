import { useId, type Dispatch, type SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModalShell } from './ModalShell'

type CreateTeamModalProps = {
    open: boolean
    newTeamName: string
    setNewTeamName: Dispatch<SetStateAction<string>>
    onCreate: () => void
    onClose: () => void
    loading: boolean
}

export function CreateTeamModal({
    open,
    newTeamName,
    setNewTeamName,
    onCreate,
    onClose,
    loading
}: CreateTeamModalProps) {
    const titleId = useId()

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-foreground mb-6"
            >
                Opprett team
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-team`}>Teamnavn</Label>
                    <Input
                        id={`${titleId}-team`}
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="F.eks. Lager, Butikk"
                    />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Avbryt
                    </Button>
                    <Button onClick={onCreate} disabled={loading}>
                        {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {loading ? 'Oppretter...' : 'Opprett'}
                    </Button>
                </div>
            </div>
        </ModalShell>
    )
}
