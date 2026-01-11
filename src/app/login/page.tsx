'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, CheckCircle } from 'lucide-react'

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
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  }

  const backgroundStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 50%, #F8FAFC 100%)',
    zIndex: 0,
  }

  const decorShape1: React.CSSProperties = {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '40%',
    height: '50%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  }

  const decorShape2: React.CSSProperties = {
    position: 'absolute',
    bottom: '-15%',
    left: '-10%',
    width: '50%',
    height: '60%',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  }

  const cardStyles: React.CSSProperties = {
    position: 'relative',
    zIndex: 1,
    background: '#FFFFFF',
    padding: '40px 36px',
    borderRadius: 16,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    maxWidth: 420,
    width: '100%',
  }

  const logoContainerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 28,
  }

  const titleStyles: React.CSSProperties = {
    fontSize: 26,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 8,
    color: '#0F172A',
    letterSpacing: '-0.02em',
  }

  const subtitleStyles: React.CSSProperties = {
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
    fontSize: 15,
    lineHeight: 1.5,
  }

  const ssoButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: '14px 20px',
    fontSize: 15,
    fontWeight: 600,
    color: '#334155',
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    transition: 'all 150ms ease',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  }

  const dividerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    margin: '24px 0',
    gap: 16,
  }

  const dividerLineStyles: React.CSSProperties = {
    flex: 1,
    height: 1,
    background: '#E2E8F0',
  }

  const dividerTextStyles: React.CSSProperties = {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: 500,
  }

  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: '#334155',
  }

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    fontSize: 16,
    border: '1px solid #E2E8F0',
    borderRadius: 10,
    marginBottom: 8,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    background: '#FFFFFF',
  }

  const inputHintStyles: React.CSSProperties = {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
  }

  const errorStyles: React.CSSProperties = {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 16,
    padding: '10px 12px',
    background: '#FEF2F2',
    borderRadius: 8,
    border: '1px solid #FECACA',
  }

  const submitButtonStyles: React.CSSProperties = {
    width: '100%',
    padding: '14px 20px',
    fontSize: 16,
    fontWeight: 600,
    color: '#FFFFFF',
    background: loading ? '#94A3B8' : '#2563EB',
    border: 'none',
    borderRadius: 10,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background 150ms ease, transform 150ms ease',
    boxShadow: loading ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
  }

  if (sent) {
    return (
      <div style={containerStyles}>
        <div style={backgroundStyles}>
          <div style={decorShape1} />
          <div style={decorShape2} />
        </div>
        <div style={cardStyles}>
          <div style={{
            width: 72,
            height: 72,
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: '#10B981',
          }}>
            <CheckCircle size={36} />
          </div>
          <h1 style={{ ...titleStyles, marginBottom: 12 }}>
            Sjekk e-posten din
          </h1>
          <p style={{ ...subtitleStyles, marginBottom: 0 }}>
            Vi har sendt en innloggingslenke til
          </p>
          <p style={{
            color: '#0F172A',
            textAlign: 'center',
            fontSize: 15,
            fontWeight: 600,
            marginTop: 4,
          }}>
            {email}
          </p>
          <p style={{
            color: '#94A3B8',
            textAlign: 'center',
            fontSize: 13,
            marginTop: 20,
            lineHeight: 1.5,
          }}>
            Lenken er gyldig i 1 time. Sjekk spam-mappen hvis du ikke finner e-posten.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyles}>
      <div style={backgroundStyles}>
        <div style={decorShape1} />
        <div style={decorShape2} />
      </div>
      <div style={cardStyles}>
        <div style={logoContainerStyles}>
          <img
            src="/tetra-logo.png"
            alt="Tetra Logo"
            style={{
              height: 56,
              width: 'auto',
            }}
          />
        </div>

        <h1 style={titleStyles}>
          Velkommen til Tetra
        </h1>

        <p style={subtitleStyles}>
          Logg inn for å administrere instrukser og avvik
        </p>

        <button
          onClick={handleAzureLogin}
          disabled={loading}
          style={ssoButtonStyles}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = '#F8FAFC'
              e.currentTarget.style.borderColor = '#CBD5E1'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF'
            e.currentTarget.style.borderColor = '#E2E8F0'
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
              e.currentTarget.style.borderColor = '#2563EB'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />

          <p style={inputHintStyles}>
            <Mail size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
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
                e.currentTarget.style.background = '#1D4ED8'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background = '#2563EB'
              }
            }}
          >
            {loading ? 'Sender...' : 'Send innloggingslenke'}
          </button>
        </form>

        <p style={{
          color: '#94A3B8',
          textAlign: 'center',
          fontSize: 12,
          marginTop: 24,
          lineHeight: 1.5,
        }}>
          Ved å logge inn godtar du bruksvilkårene for Tetra
        </p>
      </div>
    </div>
  )
}
