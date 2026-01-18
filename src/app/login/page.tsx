'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, Shield } from 'lucide-react'
import { colors, radius, shadows, transitions } from '@/lib/ui-helpers'

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

  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FFFFFF',
      padding: 24,
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      position: 'relative' as const,
      overflow: 'hidden',
    },
    decorShape1: {
      position: 'absolute' as const,
      top: '-15%',
      right: '-10%',
      width: '50%',
      height: '60%',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(5, 150, 105, 0.05) 0%, transparent 70%)',
      pointerEvents: 'none' as const,
    },
    decorShape2: {
      position: 'absolute' as const,
      bottom: '-20%',
      left: '-15%',
      width: '60%',
      height: '70%',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(2, 132, 199, 0.04) 0%, transparent 70%)',
      pointerEvents: 'none' as const,
    },
    card: {
      position: 'relative' as const,
      zIndex: 1,
      background: '#FFFFFF',
      padding: '44px 40px',
      borderRadius: radius.xl,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
      border: '1px solid #E2E8F0',
      maxWidth: 440,
      width: '100%',
    },
    logo: {
      width: 56,
      height: 56,
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      borderRadius: radius.lg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 28px',
      color: 'white',
      fontWeight: 800,
      fontSize: 24,
      boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.3)',
    },
    title: {
      fontSize: 26,
      fontWeight: 700,
      textAlign: 'center' as const,
      marginBottom: 10,
      color: '#1E293B',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      color: '#64748B',
      textAlign: 'center' as const,
      marginBottom: 28,
      fontSize: 15,
      lineHeight: 1.6,
    },
    label: {
      display: 'block',
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 10,
      color: '#1E293B',
      letterSpacing: '-0.01em',
    },
    input: {
      width: '100%',
      padding: '14px 18px',
      fontSize: 15,
      border: '1px solid #E2E8F0',
      borderRadius: radius.md,
      marginBottom: 16,
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
      fontFamily: 'inherit',
      color: '#1E293B',
      background: '#FFFFFF',
    },
    btn: {
      width: '100%',
      padding: '15px 22px',
      fontSize: 15,
      fontWeight: 600,
      color: 'white',
      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      border: 'none',
      borderRadius: radius.md,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
      boxShadow: '0 4px 12px -2px rgba(5, 150, 105, 0.35)',
      fontFamily: 'inherit',
    },
    btnDisabled: {
      background: '#94A3B8',
      cursor: 'not-allowed',
      boxShadow: 'none',
    },
    msBtn: {
      width: '100%',
      padding: '15px 22px',
      fontSize: 15,
      fontWeight: 600,
      color: '#1E293B',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: radius.md,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginBottom: 8,
      transition: `all ${transitions.normal}`,
      boxShadow: shadows.xs,
      fontFamily: 'inherit',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      margin: '24px 0',
      gap: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      background: '#E2E8F0',
    },
    dividerText: {
      fontSize: 13,
      color: '#94A3B8',
      fontWeight: 500,
    },
    errorBox: {
      padding: '14px 16px',
      background: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: radius.md,
      color: '#DC2626',
      fontSize: 14,
      marginBottom: 16,
    },
    hintBox: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 20,
      fontSize: 13,
      color: '#64748B',
    },
    footer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 28,
      padding: '14px 18px',
      background: '#F0FDF4',
      borderRadius: radius.md,
      border: '1px solid #BBF7D0',
    },
    footerText: {
      color: '#64748B',
      fontSize: 12,
      margin: 0,
      lineHeight: 1.5,
    },
    checkIcon: {
      width: 80,
      height: 80,
      background: '#D1FAE5',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      color: '#059669',
      boxShadow: '0 8px 20px -4px rgba(5, 150, 105, 0.25)',
    },
    emailBadge: {
      color: '#1E293B',
      textAlign: 'center' as const,
      fontSize: 16,
      fontWeight: 600,
      padding: '10px 18px',
      background: '#F0FDF4',
      borderRadius: radius.md,
      border: '1px solid #BBF7D0',
      marginBottom: 20,
    },
    infoBox: {
      padding: '16px 20px',
      background: '#F8FAFC',
      borderRadius: radius.md,
      border: '1px solid #E2E8F0',
    },
    infoText: {
      color: '#64748B',
      textAlign: 'center' as const,
      fontSize: 13,
      lineHeight: 1.6,
      margin: 0,
    },
  }

  if (sent) {
    return (
      <div style={styles.container}>
        <div style={styles.decorShape1} />
        <div style={styles.decorShape2} />
        <div style={styles.card}>
          <div style={styles.checkIcon}>
            <CheckCircle size={40} strokeWidth={2} />
          </div>
          <h1 style={styles.title}>Sjekk e-posten din</h1>
          <p style={styles.subtitle}>
            Vi har sendt en innloggingslenke til
          </p>
          <p style={styles.emailBadge}>
            {email}
          </p>
          <div style={styles.infoBox}>
            <p style={styles.infoText}>
              Lenken er gyldig i 1 time. Sjekk spam-mappen hvis du ikke finner e-posten.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.decorShape1} />
      <div style={styles.decorShape2} />
      <div style={styles.card}>
        <div style={styles.logo}>T</div>
        <h1 style={styles.title}>Logg inn på Tetra</h1>
        <p style={styles.subtitle}>
          HMS-plattformen for sikker arbeidsplass
        </p>

        <button
          onClick={handleAzureLogin}
          disabled={loading}
          style={{
            ...styles.msBtn,
            ...(loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#F8FAFC'
              e.currentTarget.style.borderColor = '#CBD5E1'
              e.currentTarget.style.boxShadow = shadows.sm
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
            e.currentTarget.style.borderColor = '#E2E8F0'
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

        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>eller</span>
          <div style={styles.dividerLine} />
        </div>

        <form onSubmit={handleLogin}>
          <label style={styles.label}>E-postadresse</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="navn@bedrift.no"
            required
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#059669'
              e.currentTarget.style.boxShadow = shadows.focus
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          <div style={styles.hintBox}>
            <Mail size={14} style={{ color: '#059669', flexShrink: 0 }} />
            <span>Du får en innloggingslenke på e-post</span>
          </div>

          {error && (
            <div style={styles.errorBox}>
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.btn,
              ...(loading ? styles.btnDisabled : {}),
            }}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px -2px rgba(5, 150, 105, 0.45)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(5, 150, 105, 0.35)'
              }
            }}
          >
            {loading ? 'Sender...' : 'Send innloggingslenke'}
          </button>
        </form>

        <div style={styles.footer}>
          <Shield size={16} style={{ color: '#059669' }} />
          <p style={styles.footerText}>
            Sikker innlogging til HMS-plattformen
          </p>
        </div>
      </div>
    </div>
  )
}
