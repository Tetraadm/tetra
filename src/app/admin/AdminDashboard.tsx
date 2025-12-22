'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
  org_id: string
}

type Instruction = {
  id: string
  title: string
  content: string | null
  severity: string
  status: string
  folder_id: string | null
  folders: { name: string } | null
}

type Folder = {
  id: string
  name: string
}

type Props = {
  profile: Profile
  organization: Organization
  teams: Team[]
  users: Profile[]
  instructions: Instruction[]
  folders: Folder[]
}

export default function AdminDashboard({ 
  profile, 
  organization, 
  teams: initialTeams, 
  users: initialUsers,
  instructions: initialInstructions,
  folders: initialFolders
}: Props) {
  const [tab, setTab] = useState<'oversikt' | 'brukere' | 'team' | 'instrukser' | 'innsikt'>('oversikt')
  const [teams, setTeams] = useState(initialTeams)
  const [users, setUsers] = useState(initialUsers)
  const [instructions, setInstructions] = useState(initialInstructions)
  const [folders, setFolders] = useState(initialFolders)
  
  // Modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateInstruction, setShowCreateInstruction] = useState(false)
  const [showInviteUser, setShowInviteUser] = useState(false)
  
  // Form states
  const [newTeamName, setNewTeamName] = useState('')
  const [newInstruction, setNewInstruction] = useState({ 
    title: '', 
    content: '', 
    severity: 'medium',
    teamIds: [] as string[],
    allTeams: false
  })
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('employee')
  const [inviteTeam, setInviteTeam] = useState('')
  
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const createTeam = async () => {
    if (!newTeamName.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('teams')
      .insert({ name: newTeamName, org_id: profile.org_id })
      .select()
      .single()

    if (!error && data) {
      setTeams([...teams, data])
      setNewTeamName('')
      setShowCreateTeam(false)
    }
    setLoading(false)
  }

  const createInstruction = async () => {
    if (!newInstruction.title.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('instructions')
      .insert({
        title: newInstruction.title,
        content: newInstruction.content,
        severity: newInstruction.severity,
        org_id: profile.org_id,
        status: 'approved',
        created_by: profile.id
      })
      .select('*, folders(*)')
      .single()

    if (!error && data) {
      // Link instruction to teams
      const teamIdsToLink = newInstruction.allTeams 
        ? teams.map(t => t.id) 
        : newInstruction.teamIds

      if (teamIdsToLink.length > 0) {
        await supabase.from('instruction_teams').insert(
          teamIdsToLink.map(teamId => ({
            instruction_id: data.id,
            team_id: teamId
          }))
        )
      }
      
      setInstructions([data, ...instructions])
      setNewInstruction({ title: '', content: '', severity: 'medium', teamIds: [], allTeams: false })
      setShowCreateInstruction(false)
    }
    setLoading(false)
  }

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return
    setLoading(true)

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error } = await supabase
      .from('invites')
      .insert({
        email: inviteEmail,
        role: inviteRole,
        team_id: inviteTeam || null,
        org_id: profile.org_id,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (!error) {
      const inviteUrl = `${window.location.origin}/invite/${token}`
      navigator.clipboard.writeText(inviteUrl)
      alert(`Invitasjonslenke kopiert til utklippstavlen!\n\n${inviteUrl}`)
      setInviteEmail('')
      setInviteRole('employee')
      setInviteTeam('')
      setShowInviteUser(false)
    }
    setLoading(false)
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
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardBody: {
      padding: 20,
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
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
    btn: {
      padding: '10px 16px',
      fontSize: 14,
      fontWeight: 600,
      color: 'white',
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
    },
    btnSecondary: {
      padding: '10px 16px',
      fontSize: 14,
      fontWeight: 500,
      color: '#64748B',
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      cursor: 'pointer',
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
    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    },
    modalContent: {
      background: 'white',
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 500,
      maxHeight: '90vh',
      overflowY: 'auto' as const,
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: 14,
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      marginBottom: 16,
      boxSizing: 'border-box' as const,
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      fontSize: 14,
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      marginBottom: 16,
      boxSizing: 'border-box' as const,
    },
    label: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 6,
      color: '#334155',
    },
    teamChip: (selected: boolean) => ({
      padding: '8px 14px',
      fontSize: 13,
      fontWeight: 500,
      borderRadius: 999,
      border: selected ? 'none' : '1px solid #E2E8F0',
      background: selected 
        ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' 
        : 'white',
      color: selected ? 'white' : '#64748B',
      cursor: 'pointer',
    }),
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={styles.logo}>Tetra</span>
          <span style={styles.orgName}>{organization.name}</span>
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
            Oversikt
          </button>
          <button style={styles.navItem(tab === 'brukere')} onClick={() => setTab('brukere')}>
            Brukere
          </button>
          <button style={styles.navItem(tab === 'team')} onClick={() => setTab('team')}>
            Team
          </button>
          <button style={styles.navItem(tab === 'instrukser')} onClick={() => setTab('instrukser')}>
            Instrukser
          </button>
          <button style={styles.navItem(tab === 'innsikt')} onClick={() => setTab('innsikt')}>
            Innsikt
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
                  <div style={styles.statValue}>{users.length}</div>
                  <div style={styles.statLabel}>Brukere</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{teams.length}</div>
                  <div style={styles.statLabel}>Team</div>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>Siste instrukser</div>
                  <div style={styles.cardBody}>
                    {instructions.slice(0, 5).map(inst => (
                      <div key={inst.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid #E2E8F0'
                      }}>
                        <span style={{ fontWeight: 500 }}>{inst.title}</span>
                        <span style={styles.badge(
                          severityColor(inst.severity).bg,
                          severityColor(inst.severity).color
                        )}>
                          {severityLabel(inst.severity)}
                        </span>
                      </div>
                    ))}
                    {instructions.length === 0 && (
                      <p style={{ color: '#64748B' }}>Ingen instrukser ennå</p>
                    )}
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardHeader}>Nyeste brukere</div>
                  <div style={styles.cardBody}>
                    {users.slice(0, 5).map(user => (
                      <div key={user.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        padding: '10px 0',
                        borderBottom: '1px solid #E2E8F0'
                      }}>
                        <span style={{ fontWeight: 500 }}>{user.full_name || 'Uten navn'}</span>
                        <span style={{ color: '#64748B', fontSize: 13 }}>{roleLabel(user.role)}</span>
                      </div>
                    ))}
                    {users.length === 0 && (
                      <p style={{ color: '#64748B' }}>Ingen brukere ennå</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'brukere' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Brukere</h1>
                  <p style={styles.pageSubtitle}>Administrer ansatte og teamledere</p>
                </div>
                <button style={styles.btn} onClick={() => setShowInviteUser(true)}>
                  + Inviter bruker
                </button>
              </div>

              <div style={styles.card}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Navn</th>
                      <th style={styles.th}>Rolle</th>
                      <th style={styles.th}>Team</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td style={styles.td}>{user.full_name || 'Uten navn'}</td>
                        <td style={styles.td}>{roleLabel(user.role)}</td>
                        <td style={styles.td}>
                          {teams.find(t => t.id === user.team_id)?.name || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'team' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Team</h1>
                  <p style={styles.pageSubtitle}>Opprett og administrer team</p>
                </div>
                <button style={styles.btn} onClick={() => setShowCreateTeam(true)}>
                  + Opprett team
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {teams.map(team => (
                  <div key={team.id} style={styles.card}>
                    <div style={styles.cardBody}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{team.name}</h3>
                      <p style={{ fontSize: 13, color: '#64748B' }}>
                        {users.filter(u => u.team_id === team.id).length} medlemmer
                      </p>
                    </div>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p style={{ color: '#64748B' }}>Ingen team opprettet ennå</p>
                )}
              </div>
            </>
          )}

          {tab === 'instrukser' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Instrukser</h1>
                  <p style={styles.pageSubtitle}>Administrer sikkerhetsinstrukser</p>
                </div>
                <button style={styles.btn} onClick={() => setShowCreateInstruction(true)}>
                  + Opprett instruks
                </button>
              </div>

              <div style={styles.card}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Tittel</th>
                      <th style={styles.th}>Alvorlighet</th>
                      <th style={styles.th}>Team</th>
                      <th style={styles.th}>Status</th>
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
                        <td style={styles.td}>—</td>
                        <td style={styles.td}>
                          <span style={styles.badge('#ECFDF5', '#10B981')}>
                            {inst.status === 'approved' ? 'Godkjent' : inst.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {instructions.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ ...styles.td, color: '#64748B' }}>
                          Ingen instrukser opprettet ennå
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'innsikt' && (
            <>
              <h1 style={styles.pageTitle}>Innsikt</h1>
              <p style={styles.pageSubtitle}>Statistikk og analyse</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>Mest åpnede instrukser</div>
                  <div style={styles.cardBody}>
                    <p style={{ color: '#64748B', fontSize: 14 }}>
                      Kommer snart – vi samler data om hvilke instrukser som åpnes mest.
                    </p>
                  </div>
                </div>

                <div style={styles.card}>
                  <div style={styles.cardHeader}>Spør Tetra – vanlige spørsmål</div>
                  <div style={styles.cardBody}>
                    <p style={{ color: '#64748B', fontSize: 14 }}>
                      Kommer snart – vi samler data om hva ansatte spør om.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div style={styles.modal} onClick={() => setShowCreateTeam(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett team</h2>
            <label style={styles.label}>Teamnavn</label>
            <input
              style={styles.input}
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="F.eks. Lager, Butikk, Kontor"
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateTeam(false)}>
                Avbryt
              </button>
              <button style={styles.btn} onClick={createTeam} disabled={loading}>
                {loading ? 'Oppretter...' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Instruction Modal */}
      {showCreateInstruction && (
        <div style={styles.modal} onClick={() => setShowCreateInstruction(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett instruks</h2>
            
            <label style={styles.label}>Tittel</label>
            <input
              style={styles.input}
              value={newInstruction.title}
              onChange={e => setNewInstruction({ ...newInstruction, title: e.target.value })}
              placeholder="F.eks. Brann: evakueringsprosedyre"
            />
            
            <label style={styles.label}>Innhold</label>
            <textarea
              style={{ ...styles.input, minHeight: 100, resize: 'vertical' }}
              value={newInstruction.content}
              onChange={e => setNewInstruction({ ...newInstruction, content: e.target.value })}
              placeholder="Beskriv instruksen..."
            />
            
            <label style={styles.label}>Alvorlighet</label>
            <select
              style={styles.select}
              value={newInstruction.severity}
              onChange={e => setNewInstruction({ ...newInstruction, severity: e.target.value })}
            >
              <option value="critical">Kritisk</option>
              <option value="medium">Middels</option>
              <option value="low">Lav</option>
            </select>

            <label style={styles.label}>Team</label>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newInstruction.allTeams}
                  onChange={e => setNewInstruction({ 
                    ...newInstruction, 
                    allTeams: e.target.checked,
                    teamIds: e.target.checked ? [] : newInstruction.teamIds
                  })}
                />
                <span style={{ fontSize: 14 }}>Alle team</span>
              </label>
              
              {!newInstruction.allTeams && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {teams.map(team => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        const ids = newInstruction.teamIds.includes(team.id)
                          ? newInstruction.teamIds.filter(id => id !== team.id)
                          : [...newInstruction.teamIds, team.id]
                        setNewInstruction({ ...newInstruction, teamIds: ids })
                      }}
                      style={styles.teamChip(newInstruction.teamIds.includes(team.id))}
                    >
                      {team.name}
                    </button>
                  ))}
                  {teams.length === 0 && (
                    <span style={{ color: '#94A3B8', fontSize: 13 }}>Opprett team først</span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateInstruction(false)}>
                Avbryt
              </button>
              <button style={styles.btn} onClick={createInstruction} disabled={loading}>
                {loading ? 'Oppretter...' : 'Opprett'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteUser && (
        <div style={styles.modal} onClick={() => setShowInviteUser(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Inviter bruker</h2>
            
            <label style={styles.label}>E-postadresse</label>
            <input
              style={styles.input}
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="bruker@bedrift.no"
            />
            
            <label style={styles.label}>Rolle</label>
            <select
              style={styles.select}
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
            >
              <option value="employee">Ansatt</option>
              <option value="teamleader">Teamleder</option>
              <option value="admin">Sikkerhetsansvarlig</option>
            </select>

            <label style={styles.label}>Team</label>
            <select
              style={styles.select}
              value={inviteTeam}
              onChange={e => setInviteTeam(e.target.value)}
            >
              <option value="">Velg team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowInviteUser(false)}>
                Avbryt
              </button>
              <button style={styles.btn} onClick={inviteUser} disabled={loading}>
                {loading ? 'Sender...' : 'Opprett invitasjon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}