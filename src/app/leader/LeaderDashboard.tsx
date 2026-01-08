'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cleanupInviteData } from '@/lib/invite-cleanup'
import AuthWatcher from '@/components/AuthWatcher'

type Profile = {
  id: string
  full_name: string
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
}

type Instruction = {
  id: string
  title: string
  content: string | null
  severity: string
  status: string
}

type Props = {
  profile: Profile
  organization: Organization
  team: Team | null
  teamMembers: Profile[]
  instructions: Instruction[]
}

export default function LeaderDashboard({ 
  profile, 
  organization, 
  team,
  teamMembers,
  instructions
}: Props) {
  const [tab, setTab] = useState<'oversikt' | 'team' | 'instrukser'>('oversikt')
  const router = useRouter()
  const supabase = createClient()

  // Cleanup invite data on mount
  useEffect(() => {
    cleanupInviteData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const severityLabel = (s: string) => {
    if (s === 'critical') return 'Kritisk'
    if (s === 'medium') return 'Middels'
    return 'Lav'
  }

  const severityColor = (s: string) => {
    if (s === 'critical') return { bg: '#FEF2F2', color: '#DC2626' }
    if (s === 'medium') return { bg: '#FFFBEB', color: '#F59E0B' }
    return { bg: '#ECFDF5', color: '#10B981' }
  }

  const roleLabel = (r: string) => {
    if (r === 'admin') return 'Sikkerhetsansvarlig'
    if (r === 'teamleader') return 'Teamleder'
    return 'Ansatt'
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#F8FAFC',
    },
    header: {
      background: 'white',
      borderBottom: '1px solid #E2E8F0',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      fontSize: 20,
      fontWeight: 800,
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    orgName: {
      fontSize: 14,
      color: '#64748B',
      marginLeft: 16,
    },
    logoutBtn: {
      padding: '8px 16px',
      fontSize: 14,
      background: 'none',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      cursor: 'pointer',
    },
    main: {
      display: 'flex',
    },
    sidebar: {
      width: 220,
      background: 'white',
      borderRight: '1px solid #E2E8F0',
      minHeight: 'calc(100vh - 65px)',
      padding: '16px 0',
    },
    navItem: (active: boolean) => ({
      display: 'block',
      width: '100%',
      padding: '12px 24px',
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active ? '#2563EB' : '#64748B',
      background: active ? '#EFF6FF' : 'transparent',
      border: 'none',
      textAlign: 'left' as const,
      cursor: 'pointer',
    }),
    content: {
      flex: 1,
      padding: 24,
    },
    pageTitle: {
      fontSize: 24,
      fontWeight: 700,
      marginBottom: 8,
    },
    pageSubtitle: {
      fontSize: 14,
      color: '#64748B',
      marginBottom: 24,
    },
    card: {
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      marginBottom: 16,
    },
    cardHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #E2E8F0',
      fontWeight: 600,
    },
    cardBody: {
      padding: 20,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      marginBottom: 24,
    },
    statCard: {
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      padding: 20,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 700,
    },
    statLabel: {
      fontSize: 13,
      color: '#64748B',
      marginTop: 4,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      textAlign: 'left' as const,
      padding: '12px 16px',
      fontSize: 12,
      fontWeight: 600,
      color: '#64748B',
      textTransform: 'uppercase' as const,
      borderBottom: '1px solid #E2E8F0',
    },
    td: {
      padding: '12px 16px',
      fontSize: 14,
      borderBottom: '1px solid #E2E8F0',
    },
    badge: (bg: string, color: string) => ({
      display: 'inline-block',
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 999,
      background: bg,
      color: color,
    }),
  }

  return (
    <>
      <AuthWatcher />
      <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/tetra-logo.png" alt="Tetra" style={{ height: 32, width: 'auto' }} />
          <span style={styles.orgName}>{organization.name} – {team?.name || 'Ingen team'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: '#64748B' }}>{profile.full_name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logg ut</button>
        </div>
      </header>

      <div style={styles.main}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <button style={styles.navItem(tab === 'oversikt')} onClick={() => setTab('oversikt')}>
            🏠 Oversikt
          </button>
          <button style={styles.navItem(tab === 'team')} onClick={() => setTab('team')}>
            👥 Mitt team
          </button>
          <button style={styles.navItem(tab === 'instrukser')} onClick={() => setTab('instrukser')}>
            📋 Instrukser
          </button>
        </aside>

        {/* Content */}
        <main style={styles.content}>
          {tab === 'oversikt' && (
            <>
              <h1 style={styles.pageTitle}>Oversikt</h1>
              <p style={styles.pageSubtitle}>Velkommen tilbake, {profile.full_name}</p>

              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{teamMembers.length}</div>
                  <div style={styles.statLabel}>Teammedlemmer</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{instructions.length}</div>
                  <div style={styles.statLabel}>Instrukser</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statValue, color: '#DC2626' }}>
                    {instructions.filter(i => i.severity === 'critical').length}
                  </div>
                  <div style={styles.statLabel}>Kritiske</div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>Kritiske instrukser</div>
                <div style={styles.cardBody}>
                  {instructions.filter(i => i.severity === 'critical').map(inst => (
                    <div key={inst.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid #E2E8F0'
                    }}>
                      <span style={{ fontWeight: 500 }}>{inst.title}</span>
                      <span style={styles.badge('#FEF2F2', '#DC2626')}>Kritisk</span>
                    </div>
                  ))}
                  {instructions.filter(i => i.severity === 'critical').length === 0 && (
                    <p style={{ color: '#64748B' }}>Ingen kritiske instrukser</p>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'team' && (
            <>
              <h1 style={styles.pageTitle}>Mitt team</h1>
              <p style={styles.pageSubtitle}>{team?.name || 'Ingen team tildelt'}</p>

              <div style={styles.card}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Navn</th>
                      <th style={styles.th}>Rolle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map(member => (
                      <tr key={member.id}>
                        <td style={styles.td}>{member.full_name || 'Uten navn'}</td>
                        <td style={styles.td}>{roleLabel(member.role)}</td>
                      </tr>
                    ))}
                    {teamMembers.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ ...styles.td, color: '#64748B' }}>
                          Ingen medlemmer i teamet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'instrukser' && (
            <>
              <h1 style={styles.pageTitle}>Instrukser</h1>
              <p style={styles.pageSubtitle}>Instrukser for {team?.name || 'ditt team'}</p>

              <div style={styles.card}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Tittel</th>
                      <th style={styles.th}>Alvorlighet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructions.map(inst => (
                      <tr key={inst.id}>
                        <td style={styles.td}>{inst.title}</td>
                        <td style={styles.td}>
                          <span style={styles.badge(
                            severityColor(inst.severity).bg,
                            severityColor(inst.severity).color
                          )}>
                            {severityLabel(inst.severity)}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {instructions.length === 0 && (
                      <tr>
                        <td colSpan={2} style={{ ...styles.td, color: '#64748B' }}>
                          Ingen instrukser tildelt teamet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
      </div>
    </>
  )
}