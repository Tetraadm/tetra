'use client'

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    // F-11: Report error to Sentry
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <html lang="no">
            <body>
                <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
                    <div className="flex flex-col items-center space-y-4 text-center p-8">
                        <div className="rounded-full bg-destructive/10 p-4">
                            <AlertTriangle className="h-12 w-12 text-destructive" />
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Kritisk Systemfeil</h1>
                        <p className="max-w-[500px] text-muted-foreground">
                            Applikasjonen kunne ikke lastes. Vennligst prøv å oppdatere siden. (Feilkode: {error.digest})
                        </p>
                        <Button onClick={() => reset()}>
                            Last inn på nytt
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    )
}
