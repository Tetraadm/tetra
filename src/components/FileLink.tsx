'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

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
        const errorMsg = err instanceof Error ? err.message : 'Kunne ikke laste vedlegg'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    }
    getUrl()
  }, [fileUrl, supabase])

  const handleOpenPdf = async () => {
    if (!signedUrl) return

    setIsOpening(true)

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    if (isIOS) {
      // iOS Safari: Use window.location for reliable PDF opening
      window.location.href = signedUrl
    } else {
      // Other browsers: Open in new tab
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    }

    // Reset opening state after a delay
    setTimeout(() => setIsOpening(false), 1000)
  }

  if (error) {
    return (
      <div style={{
        padding: '12px 16px',
        background: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: 8,
        color: '#DC2626',
        fontSize: 14
      }}>
        ⚠️ {error}
      </div>
    )
  }

  if (!signedUrl) {
    return <p style={{ color: '#64748B', fontSize: 14 }}>Laster vedlegg...</p>
  }

  return (
    <button
      onClick={handleOpenPdf}
      disabled={isOpening}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        background: isOpening ? '#DBEAFE' : '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: 8,
        color: '#2563EB',
        fontWeight: 600,
        fontSize: 14,
        width: '100%',
        cursor: isOpening ? 'wait' : 'pointer',
        boxSizing: 'border-box' as const
      }}
    >
      📄 {isOpening ? 'Åpner...' : 'Åpne vedlegg (PDF)'}
    </button>
  )
}
