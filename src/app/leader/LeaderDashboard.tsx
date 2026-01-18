'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { FileText, Home, Users, Menu, X, LogOut, Inbox } from 'lucide-react'
import { cleanupInviteData } from '@/lib/invite-cleanup'
import AuthWatcher from '@/components/AuthWatcher'
import type { Profile, Organization, Team } from '@/lib/types'
import { severityLabel, severityColor, roleLabel } from '@/lib/ui-helpers'

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
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    cleanupInviteData()
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab)
    setShowMobileMenu(false)
  }

  const criticalInstructions = instructions.filter(i => i.severity === 'critical')

  return (
    <>
      <AuthWatcher />
      <div className="nt-app-container">
        <header className="nt-app-header">
          <div className="nt-app-header__brand">
            {isMobile && (
              <button
                className="nt-mobile-menu-btn"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label={showMobileMenu ? 'Lukk meny' : 'Åpne meny'}
              >
                {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <Image
              src="/tetra-logo.png"
              alt="Tetra"
              width={120}
              height={32}
              style={{ height: 32, width: 'auto' }}
            />
            {!isMobile && (
              <span className="nt-app-org-badge">
                {organization.name} – {team?.name || 'Ingen team'}
              </span>
            )}
          </div>
          <div className="nt-app-header__actions">
            {!isMobile && (
              <span className="nt-app-user-name">{profile.full_name}</span>
            )}
            <button className="nt-btn nt-btn-secondary nt-btn-sm" onClick={handleLogout}>
              {isMobile ? <LogOut size={18} /> : <><LogOut size={16} /> Logg ut</>}
            </button>
          </div>
        </header>

        <div className="nt-app-layout">
          <aside className={`nt-app-sidebar ${showMobileMenu ? 'nt-app-sidebar--open' : ''}`}>
            <nav className="nt-app-nav">
              <button
                className={`nt-nav-item ${tab === 'oversikt' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('oversikt')}
              >
                <Home size={18} aria-hidden="true" />
                Oversikt
              </button>
              <button
                className={`nt-nav-item ${tab === 'team' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('team')}
              >
                <Users size={18} aria-hidden="true" />
                Mitt team
              </button>
              <button
                className={`nt-nav-item ${tab === 'instrukser' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('instrukser')}
              >
                <FileText size={18} aria-hidden="true" />
                Instrukser
              </button>
            </nav>
          </aside>

          <main className="nt-app-content">
            {tab === 'oversikt' && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                    letterSpacing: '-0.02em'
                  }}>
                    Oversikt
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Velkommen tilbake, {profile.full_name}
                  </p>
                </div>

                <div className="nt-grid-3" style={{ marginBottom: 'var(--space-6)' }}>
                  <div className="nt-stat-card">
                    <div className="nt-stat-card__icon nt-stat-card__icon--primary">
                      <Users size={22} aria-hidden="true" />
                    </div>
                    <div className="nt-stat-card__value">{teamMembers.length}</div>
                    <div className="nt-stat-card__label">Teammedlemmer</div>
                  </div>
                  <div className="nt-stat-card">
                    <div className="nt-stat-card__icon nt-stat-card__icon--primary">
                      <FileText size={22} aria-hidden="true" />
                    </div>
                    <div className="nt-stat-card__value">{instructions.length}</div>
                    <div className="nt-stat-card__label">Instrukser</div>
                  </div>
                  <div className="nt-stat-card">
                    <div className="nt-stat-card__icon nt-stat-card__icon--danger">
                      <FileText size={22} aria-hidden="true" />
                    </div>
                    <div className="nt-stat-card__value nt-stat-card__value--danger">
                      {criticalInstructions.length}
                    </div>
                    <div className="nt-stat-card__label">Kritiske</div>
                  </div>
                </div>

                <div className="nt-card">
                  <h2 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-5)',
                    letterSpacing: '-0.01em'
                  }}>
                    Kritiske instrukser
                  </h2>
                  {criticalInstructions.length === 0 ? (
                    <div className="nt-empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
                      <Inbox className="nt-empty-state__icon" />
                      <h3 className="nt-empty-state__title">Ingen kritiske instrukser</h3>
                      <p className="nt-empty-state__description">
                        Det er ingen kritiske instrukser tildelt ditt team for øyeblikket.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {criticalInstructions.map(inst => (
                        <div
                          key={inst.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--space-4)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <div style={{
                              width: 40,
                              height: 40,
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--color-danger-100)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-danger-700)',
                              flexShrink: 0
                            }}>
                              <FileText size={18} aria-hidden="true" />
                            </div>
                            <span style={{
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              fontSize: '0.9375rem'
                            }}>
                              {inst.title}
                            </span>
                          </div>
                          <span
                            className="nt-badge"
                            style={{
                              background: severityColor(inst.severity).bg,
                              color: severityColor(inst.severity).color
                            }}
                          >
                            {severityLabel(inst.severity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === 'team' && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                    letterSpacing: '-0.02em'
                  }}>
                    Mitt team
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {team?.name || 'Ingen team tildelt'}
                  </p>
                </div>

                {teamMembers.length === 0 ? (
                  <div className="nt-empty-state">
                    <Users className="nt-empty-state__icon" />
                    <h3 className="nt-empty-state__title">Ingen teammedlemmer</h3>
                    <p className="nt-empty-state__description">
                      Det er ingen medlemmer tildelt teamet ditt ennå. Kontakt en administrator for å legge til medlemmer.
                    </p>
                  </div>
                ) : (
                  <div className="nt-table-container">
                    <table className="nt-table">
                      <thead>
                        <tr>
                          <th>Navn</th>
                          <th>Rolle</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamMembers.map(member => (
                          <tr key={member.id}>
                            <td style={{ fontWeight: 500 }}>{member.full_name || 'Uten navn'}</td>
                            <td>
                              <span
                                className="nt-badge"
                                style={{
                                  background: 'var(--color-slate-100)',
                                  color: 'var(--color-slate-700)'
                                }}
                              >
                                {roleLabel(member.role)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'instrukser' && (
              <>
                <div style={{ marginBottom: 32 }}>
                  <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                    letterSpacing: '-0.02em'
                  }}>
                    Instrukser
                  </h1>
                  <p style={{
                    fontSize: '1rem',
                    color: 'var(--text-secondary)'
                  }}>
                    Instrukser for {team?.name || 'ditt team'}
                  </p>
                </div>

                {instructions.length === 0 ? (
                  <div className="nt-empty-state">
                    <FileText className="nt-empty-state__icon" />
                    <h3 className="nt-empty-state__title">Ingen instrukser</h3>
                    <p className="nt-empty-state__description">
                      Det er ingen instrukser tildelt teamet ditt ennå. Instrukser vil vises her når de blir publisert.
                    </p>
                  </div>
                ) : (
                  <div className="nt-table-container">
                    <table className="nt-table">
                      <thead>
                        <tr>
                          <th>Tittel</th>
                          <th>Alvorlighet</th>
                        </tr>
                      </thead>
                      <tbody>
                        {instructions.map(inst => (
                          <tr key={inst.id}>
                            <td style={{ fontWeight: 500 }}>{inst.title}</td>
                            <td>
                              <span
                                className="nt-badge"
                                style={{
                                  background: severityColor(inst.severity).bg,
                                  color: severityColor(inst.severity).color
                                }}
                              >
                                {severityLabel(inst.severity)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
