'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { CheckCircle, Shield, Building2, Users, UserCircle } from 'lucide-react'
import { TetraLogo } from '@/components/tetra-logo'
import toast from 'react-hot-toast'
import type { Organization, Team } from '@/lib/types'
import { roleLabel, colors, shadows, radius, transitions } from '@/lib/ui-helpers'

type Invite = {
  id: string
  role: string
  org_id: string
  team_id: string | null
  token: string
}

type Props = {
  invite: Invite
  organization: Organization
  team: Team | null
  token: string
}

export default function AcceptInvite({ invite, organization, team, token }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'check-email'>('form')
  const supabase = createClient()

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !email.trim()) return

    setLoading(true)
    // Store full name in cookie for server-side callback to read
    // F-14: Use Secure in production and SameSite=Strict for better security
    const isSecure = window.location.protocol === 'https:'
    document.cookie = `invite_fullname=${encodeURIComponent(fullName.trim())}; path=/; max-age=3600; SameSite=Strict${isSecure ? '; Secure' : ''}`

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/invite/${token}/callback`,
      },
    })

    if (error) {
      toast.error('Kunne ikke sende e-post. Prøv igjen.')
      console.error('OTP email error:', error.message)
      setLoading(false)
      return
    }

    setStep('check-email')
    setLoading(false)
  }



  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: colors.background,
      padding: 24,
      fontFamily: 'inherit',
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
      background: 'radial-gradient(circle, rgba(14, 116, 144, 0.12) 0%, transparent 70%)',
      pointerEvents: 'none' as const,
    },
    decorShape2: {
      position: 'absolute' as const,
      bottom: '-20%',
      left: '-15%',
      width: '60%',
      height: '70%',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
      pointerEvents: 'none' as const,
    },
    card: {
      position: 'relative' as const,
      zIndex: 1,
      background: colors.surface,
      padding: '44px 40px',
      borderRadius: radius.xl,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
      border: `1px solid ${colors.border}`,
      maxWidth: 460,
      width: '100%',
    },
    logo: {
      width: 56,
      height: 56,
      background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)`,
      borderRadius: radius.lg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 28px',
      color: 'white',
      fontWeight: 800,
      fontSize: 24,
      boxShadow: '0 12px 24px -12px rgba(14, 116, 144, 0.35)',
    },
    title: {
      fontSize: 26,
      fontWeight: 700,
      textAlign: 'center' as const,
      marginBottom: 10,
      color: colors.text,
      letterSpacing: '-0.02em',
    },
    subtitle: {
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginBottom: 28,
      fontSize: 15,
      lineHeight: 1.6,
    },
    infoBox: {
      background: colors.backgroundSubtle,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
      padding: 20,
      marginBottom: 28,
    },
    infoRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      fontSize: 14,
      borderBottom: `1px solid ${colors.borderSubtle}`,
    },
    infoLabel: {
      color: colors.textMuted,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    infoValue: {
      fontWeight: 600,
      color: colors.text,
    },
    label: {
      display: 'block',
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 10,
      color: colors.text,
      letterSpacing: '-0.01em',
    },
    input: {
      width: '100%',
      padding: '14px 18px',
      fontSize: 15,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      marginBottom: 20,
      outline: 'none',
      boxSizing: 'border-box' as const,
      transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
      fontFamily: 'inherit',
      color: colors.text,
      background: colors.surface,
    },
    btn: {
      width: '100%',
      padding: '15px 22px',
      fontSize: 15,
      fontWeight: 600,
      color: 'white',
      background: `linear-gradient(135deg, var(--primary) 0%, var(--primary-strong) 100%)`,
      border: 'none',
      borderRadius: radius.md,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
      boxShadow: '0 8px 20px -12px rgba(14, 116, 144, 0.4)',
      fontFamily: 'inherit',
    },
    checkIcon: {
      width: 80,
      height: 80,
      background: colors.successLight,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      color: colors.success,
      boxShadow: `0 8px 20px -4px rgba(5, 150, 105, 0.25)`,
    },
  }

  if (step === 'check-email') {
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
          <p style={{
            color: colors.text,
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 600,
            padding: '10px 18px',
            background: colors.primarySubtle,
            borderRadius: radius.md,
            border: `1px solid ${colors.primaryMuted}`,
            marginBottom: 20,
          }}>
            {email}
          </p>
          <div style={{
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
    <div style={styles.container}>
      <div style={styles.decorShape1} />
      <div style={styles.decorShape2} />
      <div style={styles.card}>
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <TetraLogo variant="full" />
        </div>
        <h1 style={styles.title}>Du er invitert!</h1>
        <p style={styles.subtitle}>
          Du har blitt invitert til å bli med i Tetrivo HMS-plattformen
        </p>

        <div style={styles.infoBox}>
          <div style={{ ...styles.infoRow, borderBottom: team ? `1px solid ${colors.borderSubtle}` : 'none' }}>
            <span style={styles.infoLabel}>
              <Building2 size={16} />
              Bedrift
            </span>
            <span style={styles.infoValue}>{organization.name}</span>
          </div>
          <div style={{ ...styles.infoRow, borderBottom: team ? `1px solid ${colors.borderSubtle}` : 'none' }}>
            <span style={styles.infoLabel}>
              <UserCircle size={16} />
              Rolle
            </span>
            <span style={styles.infoValue}>{roleLabel(invite.role)}</span>
          </div>
          {team && (
            <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
              <span style={styles.infoLabel}>
                <Users size={16} />
                Team
              </span>
              <span style={styles.infoValue}>{team.name}</span>
            </div>
          )}
        </div>

        <div>
          <label style={styles.label}>Ditt navn</label>
          <input
            style={styles.input}
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ola Nordmann"
            required
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary
              e.currentTarget.style.boxShadow = shadows.focus
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          <label style={styles.label}>E-postadresse</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ola@bedrift.no"
            required
            onFocus={(e) => {
              e.currentTarget.style.borderColor = colors.primary
              e.currentTarget.style.boxShadow = shadows.focus
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.boxShadow = 'none'
            }}
          />



          <form onSubmit={handleAccept}>
            <button
              type="submit"
              style={{
                ...styles.btn,
                background: loading ? colors.textMuted : styles.btn.background,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : styles.btn.boxShadow,
              }}
              disabled={loading}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = `0 6px 16px -2px ${colors.primary}50`
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = `0 4px 12px -2px ${colors.primary}40`
                }
              }}
            >
              {loading ? 'Sender ...' : 'Send innloggingslenke på e-post'}
            </button>
          </form>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 24,
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
              Sikker invitasjon til HMS-plattformen
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
