'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, Shield } from 'lucide-react'
import { colors, shadows, radius, transitions } from '@/lib/ui-helpers'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  const handleAzureLogin = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email',
      },
    })

    if (error) {
      toast.error('Kunne ikke logge inn med Microsoft')
      setLoading(false)
    }
  }

  const containerStyles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  }

  const backgroundStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(145deg, ${colors.background} 0%, #E6F7F5 50%, ${colors.background} 100%)`,
    zIndex: 0,
  }

  const decorShape1: React.CSSProperties = {
    position: 'absolute',
    top: '-15%',
    right: '-10%',
    width: '50%',
    height: '60%',
    borderRadius: '50%',
    background: `radial-gradient(circle, rgba(13, 148, 136, 0.08) 0%, transparent 70%)`,
    pointerEvents: 'none',
  }

  const decorShape2: React.CSSProperties = {
    position: 'absolute',
    bottom: '-20%',
    left: '-15%',
    width: '60%',
    height: '70%',
    borderRadius: '50%',
    background: `radial-gradient(circle, rgba(13, 148, 136, 0.06) 0%, transparent 70%)`,
    pointerEvents: 'none',
  }

  const decorShape3: React.CSSProperties = {
    position: 'absolute',
    top: '40%',
    left: '5%',
    width: '20%',
    height: '30%',
    borderRadius: '50%',
    background: `radial-gradient(circle, rgba(13, 148, 136, 0.04) 0%, transparent 70%)`,
    pointerEvents: 'none',
  }

  const cardStyles: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    padding: '44px 40px',
    borderRadius: radius.xl,
    boxShadow: shadows.xl,
    border: '1px solid rgba(255, 255, 255, 0.8)',
    maxWidth: 440,
    width: '100%',
  }

  const logoContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 32,
  }

  const titleStyles: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 10,
    color: colors.text,
    letterSpacing: '-0.02em',
  }

  const subtitleStyles: React.CSSProperties = {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 15,
    lineHeight: 1.6,
  }

  const ssoButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: '15px 22px',
    fontSize: 15,
    fontWeight: 600,
    color: colors.text,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
    transition: `all ${transitions.normal}`,
    boxShadow: shadows.xs,
  }

  const dividerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    margin: '28px 0',
    gap: 16,
  }

  const dividerLineStyles: React.CSSProperties = {
    flex: 1,
    height: 1,
    background: colors.border,
  }

  const dividerTextStyles: React.CSSProperties = {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: 500,
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 10,
    color: colors.text,
    letterSpacing: '-0.01em',
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    fontSize: 15,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    marginBottom: 10,
    outline: 'none',
    boxSizing: 'border-box',
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
    background: colors.surface,
    fontFamily: 'inherit',
    color: colors.text,
  }

  const inputHintStyles: React.CSSProperties = {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const errorStyles: React.CSSProperties = {
    color: colors.danger,
    fontSize: 14,
    marginBottom: 20,
    padding: '12px 16px',
    background: colors.dangerLight,
    borderRadius: radius.md,
    border: `1px solid ${colors.dangerBorder}`,
    fontWeight: 500,
  }

  const submitButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: '15px 22px',
    fontSize: 15,
    fontWeight: 600,
    color: colors.textInverse,
    background: loading ? colors.textMuted : colors.primary,
    border: 'none',
    borderRadius: radius.md,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: `all ${transitions.normal}`,
    boxShadow: loading ? 'none' : `0 4px 12px -2px rgba(13, 148, 136, 0.35)`,
    fontFamily: 'inherit',
  }

  if (sent) {
    return (
      <div style={containerStyles}>
        <div style={backgroundStyles}>
          <div style={decorShape1} />
          <div style={decorShape2} />
          <div style={decorShape3} />
        </div>
        <div style={cardStyles}>
          <div style={{
            width: 80,
            height: 80,
            background: `linear-gradient(135deg, ${colors.successLight} 0%, ${colors.successBorder} 100%)`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            color: colors.success,
            boxShadow: `0 8px 20px -4px rgba(5, 150, 105, 0.25)`,
          }}>
            <CheckCircle size={40} strokeWidth={2} />
          </div>
          <h1 style={{ ...titleStyles, marginBottom: 14 }}>
            Sjekk e-posten din
          </h1>
          <p style={{ ...subtitleStyles, marginBottom: 8 }}>
            Vi har sendt en innloggingslenke til
          </p>
          <p style={{
            color: colors.text,
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 600,
            marginTop: 4,
            padding: '8px 16px',
            background: colors.primarySubtle,
            borderRadius: radius.md,
            display: 'inline-block',
            margin: '8px auto 0',
            width: 'fit-content',
          }}>
            {email}
          </p>
          <div style={{
            marginTop: 28,
            padding: '16px 20px',
            background: colors.backgroundSubtle,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
          }}>
            <p style={{
              color: colors.textSecondary,
              textAlign: 'center',
              fontSize: 13,
              lineHeight: 1.6,
              margin: 0,
            }}>
              Lenken er gyldig i 1 time. Sjekk spam-mappen hvis du ikke finner e-posten.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      <div style={backgroundStyles}>
        <div style={decorShape1} />
        <div style={decorShape2} />
        <div style={decorShape3} />
      </div>
      <div style={cardStyles}>
        <div style={logoContainerStyles}>
          <Image
            src="/tetra-logo.png"
            alt="Tetra Logo"
            width={200}
            height={60}
            style={{
              height: 60,
              width: 'auto',
            }}
          />
        </div>

        <h1 style={titleStyles}>
          Velkommen til Tetra
        </h1>

        <p style={subtitleStyles}>
          Logg inn for å administrere HMS-instrukser og avvik
        </p>

        <button
          onClick={handleAzureLogin}
          disabled={loading}
          style={ssoButtonStyles}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = colors.backgroundSubtle
              e.currentTarget.style.borderColor = colors.borderStrong
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = shadows.sm
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.surface
            e.currentTarget.style.borderColor = colors.border
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = shadows.xs
          }}
        >
          <svg width="20" height="20" viewBox="0 0 23 23">
            <path fill="#f35325" d="M0 0h10.931v10.931H0z" />
            <path fill="#81bc06" d="M12.069 0H23v10.931H12.069z" />
            <path fill="#05a6f0" d="M0 12.069h10.931V23H0z" />
            <path fill="#ffba08" d="M12.069 12.069H23V23H12.069z" />
          </svg>
          Fortsett med Microsoft
        </button>

        <div style={dividerStyles}>
          <div style={dividerLineStyles} />
          <span style={dividerTextStyles}>eller bruk e-post</span>
          <div style={dividerLineStyles} />
        </div>

        <form onSubmit={handleLogin}>
          <label htmlFor="email" style={labelStyles}>
            E-postadresse
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="navn@bedrift.no"
            required
            style={inputStyles}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary
              e.currentTarget.style.boxShadow = shadows.focus
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          <p style={inputHintStyles}>
            <Mail size={14} />
            Du får en innloggingslenke på e-post
          </p>

          {error && (
            <p style={errorStyles}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={submitButtonStyles}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = colors.primaryHover
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(13, 148, 136, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = colors.primary
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(13, 148, 136, 0.35)'
              }
            }}
          >
            {loading ? 'Sender...' : 'Send innloggingslenke'}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginTop: 28,
          padding: '12px 16px',
          background: colors.primarySubtle,
          borderRadius: radius.md,
          border: `1px solid ${colors.primaryMuted}`,
        }}>
          <Shield size={16} style={{ color: colors.primary }} />
          <p style={{
            color: colors.textSecondary,
            fontSize: 12,
            margin: 0,
            lineHeight: 1.5,
          }}>
            Sikker innlogging for HMS-plattformen
          </p>
        </div>
      </div>
    </div>
  )
}
