'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Organization, Team } from '@/lib/types'
import { roleLabel } from '@/lib/ui-helpers'

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

    // Store name in localStorage to use after auth
    localStorage.setItem('invite_data', JSON.stringify({
      token,
      fullName,
      orgId: invite.org_id,
      teamId: invite.team_id,
      role: invite.role
    }))

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/invite/${token}/callback`,
      },
    })

    if (error) {
      toast.error('Kunne ikke sende e-post: ' + error.message)
      setLoading(false)
      return
    }

    setStep('check-email')
    setLoading(false)
  }

  const handleAzureAccept = async () => {
    if (!fullName.trim()) {
      toast.error('Vennligst skriv inn navnet ditt')
      return
    }

    setLoading(true)

    // Store name in localStorage to use after auth
    localStorage.setItem('invite_data', JSON.stringify({
      token,
      fullName,
      orgId: invite.org_id,
      teamId: invite.team_id,
      role: invite.role
    }))

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/invite/${token}/callback`,
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
      background: '#F8FAFC',
      padding: 20,
    },
    card: {
      background: 'white',
      padding: 40,
      borderRadius: 16,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      maxWidth: 450,
      width: '100%',
    },
    logo: {
      width: 48,
      height: 48,
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 24px',
      color: 'white',
      fontWeight: 800,
      fontSize: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      textAlign: 'center' as const,
      marginBottom: 8,
    },
    subtitle: {
      color: '#64748B',
      textAlign: 'center' as const,
      marginBottom: 24,
      fontSize: 15,
    },
    infoBox: {
      background: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      fontSize: 14,
    },
    infoLabel: {
      color: '#64748B',
    },
    infoValue: {
      fontWeight: 600,
    },
    label: {
      display: 'block',
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 8,
      color: '#334155',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: 16,
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      marginBottom: 20,
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    btn: {
      width: '100%',
      padding: '14px 20px',
      fontSize: 16,
      fontWeight: 600,
      color: 'white',
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
    },
    checkIcon: {
      width: 64,
      height: 64,
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      color: 'white',
      fontSize: 28,
    },
  }

  if (step === 'check-email') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.checkIcon}>
            <CheckCircle size={28} aria-hidden="true" />
          </div>
          <h1 style={styles.title}>Sjekk e-posten din</h1>
          <p style={styles.subtitle}>
            Vi har sendt en innloggingslenke til <strong>{email}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>T</div>
        <h1 style={styles.title}>Du er invitert!</h1>
        <p style={styles.subtitle}>
          Du har blitt invitert til å bli med i Tetra
        </p>

        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Bedrift</span>
            <span style={styles.infoValue}>{organization.name}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Rolle</span>
            <span style={styles.infoValue}>{roleLabel(invite.role)}</span>
          </div>
          {team && (
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Team</span>
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
          />

          <label style={styles.label}>E-postadresse</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ola@bedrift.no"
            required
          />

          {/* SSO Button */}
          <button
            onClick={handleAzureAccept}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              fontSize: 15,
              fontWeight: 600,
              color: '#334155',
              background: 'white',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 20
            }}
          >
            <svg width="18" height="18" viewBox="0 0 23 23">
              <path fill="#f35325" d="M0 0h10.931v10.931H0z"/>
              <path fill="#81bc06" d="M12.069 0H23v10.931H12.069z"/>
              <path fill="#05a6f0" d="M0 12.069h10.931V23H0z"/>
              <path fill="#ffba08" d="M12.069 12.069H23V23H12.069z"/>
            </svg>
            Fortsett med Microsoft
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '16px 0',
            gap: 12
          }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: 13, color: '#64748B' }}>eller</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          <form onSubmit={handleAccept}>
            <button
              type="submit"
              style={{
                ...styles.btn,
                background: loading ? '#94A3B8' : styles.btn.background,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Sender...' : 'Send innloggingslenke på e-post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
