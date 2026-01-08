'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DemoPage() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [message, setMessage] = useState('Laster demo...')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const setupDemo = async () => {
      try {
        // Check if already logged in
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          // Already logged in, check if demo user
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, org_id, organizations(name)')
            .eq('id', user.id)
            .single()

          if (profile && profile.email === 'admin@demo.no') {
            setMessage('Demo-bruker allerede innlogget! Sender til dashboard...')
            setTimeout(() => router.push('/admin'), 1500)
            return
          }
        }

        setStatus('ready')
        setMessage('Demo-miljø klart!')
      } catch (error) {
        console.error('Demo setup error:', error)
        setStatus('error')
        setMessage('Kunne ikke sette opp demo')
      }
    }

    setupDemo()
  }, [supabase, router])

  const loginAsAdmin = async () => {
    setStatus('loading')
    setMessage('Logger inn som admin...')

    // In a real demo, you'd have pre-created credentials
    // For now, we'll just redirect to login page with a message
    router.push('/login?demo=admin')
  }

  const loginAsEmployee = async () => {
    setStatus('loading')
    setMessage('Logger inn som ansatt...')
    router.push('/login?demo=employee')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 48,
        maxWidth: 600,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 48,
            marginBottom: 16
          }}>🚀</div>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#1E293B',
            marginBottom: 8
          }}>Tetra Demo</h1>
          <p style={{
            fontSize: 16,
            color: '#64748B'
          }}>Utforsk alle enterprise-funksjonene</p>
        </div>

        {status === 'loading' && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 48,
              height: 48,
              border: '4px solid #E2E8F0',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#64748B' }}>{message}</p>
          </div>
        )}

        {status === 'ready' && (
          <>
            <div style={{
              background: '#F8FAFC',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <h3 style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#475569',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>Demo-miljø inneholder:</h3>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'grid',
                gap: 8
              }}>
                {[
                  '20 HMS-instrukser med norsk innhold',
                  '4 teams (Lager, Produksjon, Butikk, Admin)',
                  '20 demo-brukere',
                  '50+ historiske aktivitetslogger',
                  'Lesebekreftelser (60-90% bekreftet)',
                  'AI chat med keyword-filtering',
                  'Komplett audit trail'
                ].map((item, i) => (
                  <li key={i} style={{
                    fontSize: 14,
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <button
                onClick={loginAsAdmin}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span style={{ fontSize: 20 }}>👨‍💼</span>
                Logg inn som Admin
              </button>

              <button
                onClick={loginAsEmployee}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  background: 'white',
                  border: '2px solid #E2E8F0',
                  borderRadius: 8,
                  color: '#475569',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.borderColor = '#667eea'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = '#E2E8F0'
                }}
              >
                <span style={{ fontSize: 20 }}>👷</span>
                Logg inn som Ansatt
              </button>
            </div>

            <div style={{
              marginTop: 24,
              padding: 16,
              background: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: 8
            }}>
              <p style={{
                fontSize: 13,
                color: '#92400E',
                margin: 0,
                lineHeight: 1.6
              }}>
                <strong>💡 Tips:</strong> Demo-data genereres første gang du kjører <code style={{
                  background: '#FDE68A',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 12
                }}>npm run seed:demo</code>
              </p>
            </div>
          </>
        )}

        {status === 'error' && (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: '#DC2626'
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <p style={{ fontSize: 16 }}>{message}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                padding: '12px 24px',
                background: '#DC2626',
                border: 'none',
                borderRadius: 8,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Prøv igjen
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
