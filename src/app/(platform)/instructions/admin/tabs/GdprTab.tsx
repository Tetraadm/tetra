'use client'

import { GdprRequestsAdmin } from '@/components/GdprRequestsAdmin'

export default function GdprTab() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">GDPR</h2>
                <p className="text-muted-foreground">
                    Håndter sletteforespørsler fra brukere
                </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
                <h3 className="font-medium mb-4">Sletteforespørsler</h3>
                <GdprRequestsAdmin />
            </div>
        </div>
    )
}
