'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface GdprDeleteRequestProps {
    userName: string
}

export function GdprDeleteRequest({ userName }: GdprDeleteRequestProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasSubmitted, setHasSubmitted] = useState(false)
    const supabase = createClient()

    const handleSubmit = async () => {
        setIsSubmitting(true)

        try {
            const response = await fetch('/api/gdpr-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason || undefined })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Kunne ikke sende forespørsel')
            }

            toast.success('Forespørselen din er sendt til administrator')
            setHasSubmitted(true)
            setIsOpen(false)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Noe gikk galt')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (hasSubmitted) {
        return (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20 p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⏳ Din sletteforespørsel er sendt og venter på behandling av administrator.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-lg border border-red-200 dark:border-red-900 p-4">
            <h3 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Slett min konto
            </h3>

            {!isOpen ? (
                <>
                    <p className="text-sm text-muted-foreground mb-3">
                        Ønsker du å slette kontoen din og alle tilknyttede data? Dette kan ikke angres.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsOpen(true)}
                        className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                    >
                        Be om sletting
                    </Button>
                </>
            ) : (
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Er du sikker, {userName}? Skriv gjerne en begrunnelse (valgfritt):
                    </p>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Hvorfor vil du slette kontoen? (valgfritt)"
                        className="w-full p-2 text-sm border rounded-md resize-none h-20 bg-background"
                        maxLength={1000}
                    />
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            disabled={isSubmitting}
                        >
                            Avbryt
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Sender...
                                </>
                            ) : (
                                'Bekreft sletting'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
