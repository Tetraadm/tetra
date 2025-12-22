'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function OnboardingPage() {
  const [fullName, setFullName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      } else {
        router.push('/login')
      }
    }
    getUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    
    setLoading(true)
    const supabase = createClient()

    // Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({ name: orgName })
      .select()
      .single()

    if (orgError || !org) {
     console.error('Error creating org:', JSON.stringify(orgError, null, 2)) 
      setLoading(false)
      return
    }

    // Create profile as admin
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        org_id: org.id,
        full_name: fullName,
        role: 'admin'
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      setLoading(false)
      return
    }

    // Redirect to admin
    router.push('/admin')
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
        maxWidth: 450,
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: 24, 
          fontWeight: 700, 
          marginBottom: 8 
        }}>
          Velkommen til Tetra
        </h1>
        
        <p style={{ 
          color: '#64748B', 
          marginBottom: 32,
          fontSize: 15
        }}>
          La oss sette opp bedriften din
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: '#334155'
          }}>
            Ditt navn
          </label>
          
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ola Nordmann"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              marginBottom: 20,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

          <label style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 8,
            color: '#334155'
          }}>
            Bedriftsnavn
          </label>
          
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="IKEA Norge AS"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: 16,
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              marginBottom: 24,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />

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
            {loading ? 'Oppretter...' : 'Kom i gang'}
          </button>
        </form>
      </div>
    </div>
  )
}