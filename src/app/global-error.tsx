'use client'

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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
                <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                    <div className="flex flex-col items-center space-y-4 text-center p-8">
                        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20">
                            <svg
                                className="h-12 w-12 text-red-600 dark:text-red-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold tracking-tight">Kritisk Systemfeil</h1>
                        <p className="max-w-[500px] text-gray-500 dark:text-gray-400">
                            Applikasjonen kunne ikke lastes. Vennligst prøv å oppdatere siden. (Feilkode: {error.digest})
                        </p>
                        <button
                            onClick={() => reset()}
                            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Last inn på nytt
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
