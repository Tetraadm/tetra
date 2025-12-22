'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
      alert('Kunne ikke sende e-post: ' + error.message)
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

        <form onSubmit={handleAccept}>
          <label style={styles.label}>Ditt navn</label>
          <input
            style={styles.input}
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Ola Nordmann"
            required
          />

          <button 
            type="submit" 
            style={{
              ...styles.btn,
              background: loading ? '#94A3B8' : styles.btn.background,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            disabled={loading}
          >
            {loading ? 'Sender...' : 'Godta invitasjon'}
          </button>
        </form>
      </div>
    </div>
  )
}