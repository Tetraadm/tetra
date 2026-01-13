'use client'

import { createClient } from '@/lib/supabase/client'
import { useState, useEffect } from 'react'
import { AlertTriangle, Paperclip, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { colors, shadows, radius, transitions } from '@/lib/ui-helpers'

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
      <div style={{
        padding: '14px 18px',
        background: colors.dangerLight,
        border: `1px solid ${colors.dangerBorder}`,
        borderRadius: radius.md,
        color: colors.danger,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontWeight: 500,
      }}>
        <AlertTriangle size={18} aria-hidden="true" />
        <span>{error}</span>
      </div>
    )
  }

  if (!signedUrl) {
    return (
      <div style={{
        padding: '14px 18px',
        background: colors.backgroundSubtle,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        color: colors.textMuted,
        fontSize: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 18,
          height: 18,
          border: `2px solid ${colors.border}`,
          borderTopColor: colors.primary,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span>Laster vedlegg...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <button
      onClick={handleOpenPdf}
      disabled={isOpening}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '14px 18px',
        background: isOpening ? colors.primarySubtle : colors.primarySubtle,
        border: `1px solid ${colors.primaryMuted}`,
        borderRadius: radius.md,
        color: colors.primary,
        fontWeight: 600,
        fontSize: 14,
        width: '100%',
        cursor: isOpening ? 'wait' : 'pointer',
        boxSizing: 'border-box',
        transition: `all ${transitions.normal}`,
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!isOpening) {
          e.currentTarget.style.background = colors.primary
          e.currentTarget.style.color = '#FFFFFF'
          e.currentTarget.style.boxShadow = shadows.md
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = colors.primarySubtle
        e.currentTarget.style.color = colors.primary
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Paperclip size={18} aria-hidden="true" />
        {isOpening ? 'Apner...' : 'Apne vedlegg (PDF)'}
      </div>
      <ExternalLink size={16} />
    </button>
  )
}
