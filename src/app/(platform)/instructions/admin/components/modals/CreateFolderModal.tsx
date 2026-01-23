import { useId, type Dispatch, type SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ModalShell } from './ModalShell'

type CreateFolderModalProps = {
    open: boolean
    newFolderName: string
    setNewFolderName: Dispatch<SetStateAction<string>>
    onCreate: () => void
    onClose: () => void
    loading: boolean
}

export function CreateFolderModal({
    open,
    newFolderName,
    setNewFolderName,
    onCreate,
    onClose,
    loading
}: CreateFolderModalProps) {
    const titleId = useId()

    return (
        <ModalShell open={open} onClose={onClose} titleId={titleId}>
            <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-foreground mb-6"
            >
                Opprett mappe
            </h2>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`${titleId}-folder`}>Mappenavn</Label>
                    <Input
                        id={`${titleId}-folder`}
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="F.eks. Brann, HMS"
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
