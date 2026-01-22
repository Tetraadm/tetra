'use client'

import { GdprDeleteRequest } from '@/components/GdprDeleteRequest'
import { GdprDataExport } from '@/components/GdprDataExport'

interface AccountTabProps {
    userName: string
    userEmail: string
}

export default function AccountTab({ userName, userEmail }: AccountTabProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Min konto</h2>
                <p className="text-muted-foreground">
                    Administrer kontoen din
                </p>
            </div>

            {/* User info */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="font-medium mb-4">Kontoinformasjon</h3>
                <dl className="space-y-2 text-sm">
                    <div className="flex">
                        <dt className="w-24 text-muted-foreground">Navn:</dt>
                        <dd>{userName}</dd>
                    </div>
                    <div className="flex">
                        <dt className="w-24 text-muted-foreground">E-post:</dt>
                        <dd>{userEmail}</dd>
                    </div>
                </dl>
            </div>

            {/* GDPR Data Export */}
            <GdprDataExport />

            {/* GDPR Delete Request */}
            <GdprDeleteRequest userName={userName} />
        </div>
    )
}

