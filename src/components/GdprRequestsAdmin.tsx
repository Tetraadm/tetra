'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Shield, Check, X, Loader2, User, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface GdprRequest {
    id: string
    user_id: string
    status: 'pending' | 'approved' | 'rejected' | 'completed'
    reason: string | null
    admin_notes: string | null
    created_at: string
    processed_at: string | null
    user: {
        id: string
        full_name: string | null
        email: string | null
    }
    processed_by_user: {
        full_name: string | null
    } | null
}

type Props = {
    onPendingCountChange?: (count: number) => void;
}

export function GdprRequestsAdmin({ onPendingCountChange }: Props) {
    const [requests, setRequests] = useState<GdprRequest[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [processingId, setProcessingId] = useState<string | null>(null)

    const fetchRequests = useCallback(async () => {
        try {
            const response = await fetch('/api/gdpr-request')
            const data = await response.json()

            if (response.ok) {
                const reqs = data.requests || []
                setRequests(reqs)
                // Notify parent of pending count change
                const pendingCount = reqs.filter((r: GdprRequest) => r.status === 'pending').length
                onPendingCountChange?.(pendingCount)
            }
        } catch (error) {
            console.error('Failed to fetch GDPR requests:', error)
        } finally {
            setIsLoading(false)
        }
    }, [onPendingCountChange])

    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    const handleProcess = async (requestId: string, status: 'approved' | 'rejected') => {
        if (status === 'approved') {
            const confirmed = window.confirm(
                'ADVARSEL: Dette vil permanent slette all brukerdata. Er du sikker?'
            )
            if (!confirmed) return
        }

        setProcessingId(requestId)

        try {
            const response = await fetch('/api/gdpr-request', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Kunne ikke behandle forespørsel')
            }

            toast.success(
                status === 'approved'
                    ? 'Bruker slettet'
                    : 'Forespørsel avslått'
            )

            fetchRequests() // Refresh list
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Noe gikk galt')
        } finally {
            setProcessingId(null)
        }
    }

    const pendingRequests = requests.filter(r => r.status === 'pending')
    const processedRequests = requests.filter(r => r.status !== 'pending')

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Ingen GDPR-forespørsler</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Pending requests */}
            {pendingRequests.length > 0 && (
                <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Ventende forespørsler ({pendingRequests.length})
                    </h4>
                    <div className="space-y-3">
                        {pendingRequests.map((request) => (
                            <div
                                key={request.id}
                                className="border rounded-lg p-4 bg-warning/10 border-warning/30"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium">
                                                {request.user?.full_name || 'Ukjent bruker'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {request.user?.email}
                                        </p>
                                        {request.reason && (
                                            <p className="text-sm mt-2 p-2 bg-background rounded">
                                                <strong>Begrunnelse:</strong> {request.reason}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Mottatt: {new Date(request.created_at).toLocaleString('nb-NO')}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleProcess(request.id, 'rejected')}
                                            disabled={processingId === request.id}
                                        >
                                            <X className="h-4 w-4 mr-1" />
                                            Avslå
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleProcess(request.id, 'approved')}
                                            disabled={processingId === request.id}
                                        >
                                            {processingId === request.id ? (
                                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4 mr-1" />
                                            )}
                                            Godkjenn
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Processed requests */}
            {processedRequests.length > 0 && (
                <div>
                    <h4 className="font-medium mb-3 text-muted-foreground">
                        Behandlede forespørsler
                    </h4>
                    <div className="space-y-2">
                        {processedRequests.slice(0, 10).map((request) => (
                            <div
                                key={request.id}
                                className="border rounded-lg p-3 text-sm"
                            >
                                <div className="flex items-center justify-between">
                                    <span>
                                        {request.user?.full_name || 'Slettet bruker'}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs ${request.status === 'completed'
                                            ? 'bg-success/10 text-success'
                                            : 'bg-destructive/10 text-destructive'
                                        }`}>
                                        {request.status === 'completed' ? 'Slettet' : 'Avslått'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Behandlet: {request.processed_at
                                        ? new Date(request.processed_at).toLocaleString('nb-NO')
                                        : 'Ukjent'}
                                    {request.processed_by_user?.full_name &&
                                        ` av ${request.processed_by_user.full_name}`}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
