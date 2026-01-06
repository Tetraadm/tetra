'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

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
          marginBottom: 32,
          fontSize: 15
        }}>
          Vi sender deg en innloggingslenke på e-post
        </p>

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