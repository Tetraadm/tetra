'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { FileText, Home, Users, ChevronRight } from 'lucide-react'
import { cleanupInviteData } from '@/lib/invite-cleanup'
import AuthWatcher from '@/components/AuthWatcher'
import type { Profile, Organization, Team } from '@/lib/types'
import { severityLabel, severityColor, roleLabel, colors, shadows, radius, transitions } from '@/lib/ui-helpers'

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

  useEffect(() => {
    cleanupInviteData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: colors.background,
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    },
    header: {
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      padding: '16px 28px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: shadows.xs,
    },
    logo: {
      fontSize: 22,
      fontWeight: 800,
      background: `linear-gradient(135deg, ${colors.primaryActive} 0%, ${colors.primary} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      letterSpacing: '-0.02em',
    },
    orgName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 16,
      padding: '5px 12px',
      background: colors.primarySubtle,
      borderRadius: radius.full,
      fontWeight: 500,
      border: `1px solid ${colors.primaryMuted}`,
    },
    logoutBtn: {
      padding: '9px 18px',
      fontSize: 13,
      fontWeight: 600,
      background: 'transparent',
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      cursor: 'pointer',
      color: colors.textSecondary,
      transition: `all ${transitions.normal}`,
    },
    main: {
      display: 'flex',
    },
    sidebar: {
      width: 240,
      background: colors.surface,
      borderRight: `1px solid ${colors.border}`,
      minHeight: 'calc(100vh - 65px)',
      padding: '20px 12px',
    },
    navItem: (active: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '12px 16px',
      fontSize: 14,
      fontWeight: active ? 600 : 500,
      color: active ? colors.primary : colors.textSecondary,
      background: active ? colors.primarySubtle : 'transparent',
      border: active ? `1px solid ${colors.primaryMuted}` : '1px solid transparent',
      borderRadius: radius.md,
      textAlign: 'left' as const,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
      marginBottom: 4,
    }),
    content: {
      flex: 1,
      padding: 32,
    },
    pageTitle: {
      fontSize: 26,
      fontWeight: 700,
      marginBottom: 8,
      color: colors.text,
      letterSpacing: '-0.02em',
    },
    pageSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 28,
      lineHeight: 1.5,
    },
    card: {
      background: colors.surface,
      borderRadius: radius.lg,
      border: `1px solid ${colors.border}`,
      marginBottom: 20,
      boxShadow: shadows.sm,
      overflow: 'hidden',
    },
    cardHeader: {
      padding: '16px 22px',
      borderBottom: `1px solid ${colors.border}`,
      fontWeight: 600,
      fontSize: 15,
      color: colors.text,
      background: colors.backgroundSubtle,
      letterSpacing: '-0.01em',
    },
    cardBody: {
      padding: 22,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 18,
      marginBottom: 28,
    },
    statCard: {
      background: colors.surface,
      borderRadius: radius.lg,
      border: `1px solid ${colors.border}`,
      padding: 22,
      boxShadow: shadows.sm,
      transition: `all ${transitions.normal}`,
    },
    statIconBox: (variant: string) => ({
      width: 44,
      height: 44,
      borderRadius: radius.md,
      background: variant === 'danger' ? colors.dangerLight : colors.primarySubtle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: variant === 'danger' ? colors.danger : colors.primary,
      marginBottom: 14,
    }),
    statValue: {
      fontSize: 32,
      fontWeight: 700,
      color: colors.text,
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 6,
      fontWeight: 500,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
    },
    th: {
      textAlign: 'left' as const,
      padding: '14px 18px',
      fontSize: 11,
      fontWeight: 700,
      color: colors.textMuted,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.06em',
      borderBottom: `1px solid ${colors.border}`,
      background: colors.backgroundSubtle,
    },
    td: {
      padding: '16px 18px',
      fontSize: 14,
      borderBottom: `1px solid ${colors.borderSubtle}`,
      color: colors.textSecondary,
    },
    badge: (bg: string, color: string, border?: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '5px 12px',
      fontSize: 11,
      fontWeight: 600,
      borderRadius: radius.full,
      background: bg,
      color: color,
      border: border ? `1px solid ${border}` : 'none',
      letterSpacing: '0.02em',
      textTransform: 'uppercase' as const,
    }),
    instructionRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 0',
      borderBottom: `1px solid ${colors.borderSubtle}`,
      transition: `background ${transitions.fast}`,
    },
  }

  return (
    <>
      <AuthWatcher />
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Image
              src="/tetra-logo.png"
              alt="Tetra"
              width={120}
              height={36}
              style={{ height: 36, width: 'auto' }}
            />
            <span style={styles.orgName}>{organization.name} – {team?.name || 'Ingen team'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 14, color: colors.textSecondary, fontWeight: 500 }}>{profile.full_name}</span>
            <button
              style={styles.logoutBtn}
              onClick={handleLogout}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundSubtle; e.currentTarget.style.borderColor = colors.borderStrong }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = colors.border }}
            >
              Logg ut
            </button>
          </div>
        </header>

        <div style={styles.main}>
          <aside style={styles.sidebar}>
            <button
              style={styles.navItem(tab === 'oversikt')}
              onClick={() => setTab('oversikt')}
              onMouseEnter={(e) => { if (tab !== 'oversikt') e.currentTarget.style.background = colors.backgroundSubtle }}
              onMouseLeave={(e) => { if (tab !== 'oversikt') e.currentTarget.style.background = 'transparent' }}
            >
              <Home size={18} aria-hidden="true" />
              Oversikt
            </button>
            <button
              style={styles.navItem(tab === 'team')}
              onClick={() => setTab('team')}
              onMouseEnter={(e) => { if (tab !== 'team') e.currentTarget.style.background = colors.backgroundSubtle }}
              onMouseLeave={(e) => { if (tab !== 'team') e.currentTarget.style.background = 'transparent' }}
            >
              <Users size={18} aria-hidden="true" />
              Mitt team
            </button>
            <button
              style={styles.navItem(tab === 'instrukser')}
              onClick={() => setTab('instrukser')}
              onMouseEnter={(e) => { if (tab !== 'instrukser') e.currentTarget.style.background = colors.backgroundSubtle }}
              onMouseLeave={(e) => { if (tab !== 'instrukser') e.currentTarget.style.background = 'transparent' }}
            >
              <FileText size={18} aria-hidden="true" />
              Instrukser
            </button>
          </aside>

          <main style={styles.content}>
            {tab === 'oversikt' && (
              <>
                <h1 style={styles.pageTitle}>Oversikt</h1>
                <p style={styles.pageSubtitle}>Velkommen tilbake, {profile.full_name}</p>

                <div style={styles.statsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statIconBox('primary')}>
                      <Users size={22} />
                    </div>
                    <div style={styles.statValue}>{teamMembers.length}</div>
                    <div style={styles.statLabel}>Teammedlemmer</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIconBox('primary')}>
                      <FileText size={22} />
                    </div>
                    <div style={styles.statValue}>{instructions.length}</div>
                    <div style={styles.statLabel}>Instrukser</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statIconBox('danger')}>
                      <FileText size={22} />
                    </div>
                    <div style={{ ...styles.statValue, color: colors.danger }}>
                      {instructions.filter(i => i.severity === 'critical').length}
                    </div>
                    <div style={styles.statLabel}>Kritiske</div>
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardHeader}>Kritiske instrukser</div>
                  <div style={styles.cardBody}>
                    {instructions.filter(i => i.severity === 'critical').map(inst => (
                      <div key={inst.id} style={styles.instructionRow}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: radius.md,
                            background: colors.dangerLight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.danger,
                          }}>
                            <FileText size={18} />
                          </div>
                          <span style={{ fontWeight: 600, color: colors.text }}>{inst.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={styles.badge(colors.dangerLight, colors.danger, colors.dangerBorder)}>Kritisk</span>
                          <ChevronRight size={18} style={{ color: colors.textMuted }} />
                        </div>
                      </div>
                    ))}
                    {instructions.filter(i => i.severity === 'critical').length === 0 && (
                      <p style={{ color: colors.textMuted, textAlign: 'center', padding: 20 }}>Ingen kritiske instrukser</p>
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
                          <td style={{ ...styles.td, fontWeight: 500, color: colors.text }}>{member.full_name || 'Uten navn'}</td>
                          <td style={styles.td}>
                            <span style={styles.badge(colors.backgroundSubtle, colors.textSecondary, colors.border)}>
                              {roleLabel(member.role)}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {teamMembers.length === 0 && (
                        <tr>
                          <td colSpan={2} style={{ ...styles.td, color: colors.textMuted, textAlign: 'center' }}>
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
                      {instructions.map(inst => {
                        const sev = severityColor(inst.severity)
                        return (
                          <tr key={inst.id}>
                            <td style={{ ...styles.td, fontWeight: 500, color: colors.text }}>{inst.title}</td>
                            <td style={styles.td}>
                              <span style={styles.badge(sev.bg, sev.color, sev.border)}>
                                {severityLabel(inst.severity)}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      {instructions.length === 0 && (
                        <tr>
                          <td colSpan={2} style={{ ...styles.td, color: colors.textMuted, textAlign: 'center' }}>
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
