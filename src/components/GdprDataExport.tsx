'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

/**
 * GDPR Data Export Component
 * 
 * Allows users to download all their personal data as JSON.
 * Implements GDPR Article 20 (Right to Data Portability).
 */
export function GdprDataExport() {
    const [isExporting, setIsExporting] = useState(false)

    const handleExport = async () => {
        setIsExporting(true)

        try {
            const response = await fetch('/api/gdpr-export')

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Kunne ikke eksportere data')
            }

            // Get the JSON data
            const blob = await response.blob()

            // Create download link
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `tetrivo-data-export-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            toast.success('Data eksportert!')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Noe gikk galt')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <div className="rounded-lg border border-blue-200 dark:border-blue-900 p-4">
            <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Eksporter mine data
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
                Last ned alle dine personlige data som JSON-fil. Inkluderer profil, lesebekreftelser, og AI-spørsmål.
            </p>
            <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950"
            >
                {isExporting ? (
                    <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Eksporterer...
                    </>
                ) : (
                    <>
                        <Download className="mr-2 h-3 w-3" />
                        Last ned data
                    </>
                )}
            </Button>
        </div>
    )
}
