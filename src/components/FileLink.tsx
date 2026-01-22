'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { AlertTriangle, Paperclip, ExternalLink, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from "@/components/ui/button"

type FileLinkProps = {
  fileUrl: string
  supabase: ReturnType<typeof createClient>
}

/**
 * Component for displaying and opening PDF attachments from Supabase storage
 * Handles signed URL generation and iOS-specific PDF opening behavior
 */
export default function FileLink({ fileUrl, supabase }: FileLinkProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUrl = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('instructions')
          .createSignedUrl(fileUrl, 3600)

        if (error) throw error

        if (data?.signedUrl) {
          setSignedUrl(data.signedUrl)
        }
      } catch (err) {
        console.error('Get signed URL error:', err)
        const errorMsg = 'Kunne ikke laste vedlegg'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    }
    getUrl()
  }, [fileUrl, supabase])

  const handleOpenPdf = async () => {
    if (!signedUrl) return

    setIsOpening(true)

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    if (isIOS) {
      window.location.href = signedUrl
    } else {
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    }

    setTimeout(() => setIsOpening(false), 1000)
  }

  if (error) {
    return (
      <div className="flex items-center gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm font-medium">
        <AlertTriangle size={18} aria-hidden="true" />
        <span>{error}</span>
      </div>
    )
  }

  if (!signedUrl) {
    return (
      <div className="flex items-center gap-2.5 p-3.5 bg-muted border rounded-md text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Laster vedlegg...</span>
      </div>
    )
  }

  return (
    <Button
      variant="outline"
      className="w-full flex items-center justify-between gap-3 h-auto py-3.5 px-4 font-semibold text-primary/90 hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition-all border-primary/20"
      onClick={handleOpenPdf}
      disabled={isOpening}
    >
      <div className="flex items-center gap-2.5">
        <Paperclip size={18} />
        {isOpening ? 'Åpner...' : 'Åpne vedlegg (PDF)'}
      </div>
      <ExternalLink size={16} />
    </Button>
  )
}
