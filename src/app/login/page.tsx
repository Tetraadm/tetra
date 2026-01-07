'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import toast from 'react-hot-toast'

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

  if (sent) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        padding: 20
      }}>
        <div style={{
          background: 'white',
          padding: 40,
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          maxWidth: 400,
          width: '100%',
          textAlign: 'center'
        }}>
          <div style={{
            width: 64,
            height: 64,
            background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'white',
            fontSize: 28
          }}>
            ✓
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Sjekk e-posten din
          </h1>
          <p style={{ color: '#64748B', fontSize: 15 }}>
            Vi har sendt en innloggingslenke til <strong>{email}</strong>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        padding: 40,
        borderRadius: 16,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        maxWidth: 400,
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <img
            src="/tetra-logo.png"
            alt="Tetra Logo"
            style={{
              height: 64,
              width: 'auto'
            }}
          />
        </div>
        
        <h1 style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          textAlign: 'center',
          marginBottom: 8 
        }}>
          Logg inn på Tetra
        </h1>
        
        <p style={{
          color: '#64748B',
          textAlign: 'center',
          marginBottom: 24,
          fontSize: 15
        }}>
          Velg hvordan du vil logge inn
        </p>

        {/* SSO Button */}
        <button
          onClick={handleAzureLogin}
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
          margin: '24px 0',
          gap: 12
        }}>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          <span style={{ fontSize: 13, color: '#64748B' }}>eller</span>
          <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
        </div>

        <form onSubmit={handleLogin}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: '#334155'
          }}>
            E-postadresse
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="navn@bedrift.no"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              marginBottom: 16,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          {error && (
            <p style={{
              color: '#DC2626',
              fontSize: 14,
              marginBottom: 16
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 16,
              fontWeight: 600,
              color: 'white',
              background: loading
                ? '#94A3B8'
                : 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Sender...' : 'Send innloggingslenke'}
          </button>
        </form>
      </div>
    </div>
  )
}