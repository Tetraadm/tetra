'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'

type Invite = {
  id: string
  email: string
  role: string
  org_id: string
  team_id: string | null
}

type Organization = {
  id: string
  name: string
}

type Team = {
  id: string
  name: string
} | null

type Props = {
  invite: Invite
  organization: Organization
  team: Team
  token: string
}

export default function AcceptInvite({ invite, organization, team, token }: Props) {
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'check-email'>('form')
  const router = useRouter()
  const supabase = createClient()

  const roleLabel = (r: string) => {
    if (r === 'admin') return 'Sikkerhetsansvarlig'
    if (r === 'teamleader') return 'Teamleder'
    return 'Ansatt'
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return

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
      email: invite.email,
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

  const handleGoogleAccept = async () => {
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
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/invite/${token}/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })

    if (error) {
      toast.error('Kunne ikke logge inn med Google')
      setLoading(false)
    }
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
          <div style={styles.checkIcon}>✓</div>
          <h1 style={styles.title}>Sjekk e-posten din</h1>
          <p style={styles.subtitle}>
            Vi har sendt en innloggingslenke til <strong>{invite.email}</strong>
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
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>E-post</span>
            <span style={styles.infoValue}>{invite.email}</span>
          </div>
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

          {/* SSO Buttons */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={handleGoogleAccept}
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
                marginBottom: 12
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Fortsett med Google
            </button>

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
                gap: 12
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
          </div>

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