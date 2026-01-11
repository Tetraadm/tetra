'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  Home,
  Users,
  UsersRound,
  FileText,
  AlertTriangle,
  Bot,
  BarChart3,
  ClipboardList,
  CheckSquare,
  Menu,
  X,
  Info,
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cleanupInviteData } from '@/lib/invite-cleanup'
import AuthWatcher from '@/components/AuthWatcher'
import type {
  Profile,
  Organization,
  Team,
  Instruction,
  Folder,
  Alert,
  AiLog
} from '@/lib/types'
import { createAdminStyles } from './styles'
import {
  OverviewTab,
  UsersTab,
  TeamsTab,
  InstructionsTab,
  AlertsTab,
  AiLogTab,
  InsightsTab,
  AuditLogTab,
  ReadConfirmationsTab
} from './tabs'
import {
  useAdminAlerts,
  useAdminInstructions,
  useAdminTeams,
  useAdminUsers,
  useAuditLogs,
  useReadReport
} from './hooks'

type Props = {
  profile: Profile
  organization: Organization
  teams: Team[]
  users: Profile[]
  instructions: Instruction[]
  folders: Folder[]
  alerts: Alert[]
  aiLogs: AiLog[]
}

export default function AdminDashboard({
  profile,
  organization,
  teams: initialTeams,
  users: initialUsers,
  instructions: initialInstructions,
  folders: initialFolders,
  alerts: initialAlerts,
  aiLogs
}: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [tab, setTab] = useState<'oversikt' | 'brukere' | 'team' | 'instrukser' | 'avvik' | 'ailogg' | 'innsikt' | 'auditlog' | 'lesebekreftelser'>('oversikt')
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateInstruction, setShowCreateInstruction] = useState(false)
  const [showInviteUser, setShowInviteUser] = useState(false)
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [showEditInstruction, setShowEditInstruction] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    cleanupInviteData()
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const {
    teams,
    newTeamName,
    setNewTeamName,
    createTeam,
    deleteTeam,
    teamLoading
  } = useAdminTeams({
    profile,
    initialTeams,
    supabase,
    onCloseCreateTeam: () => setShowCreateTeam(false)
  })

  const {
    users,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteTeam,
    setInviteTeam,
    editingUser,
    editUserRole,
    setEditUserRole,
    editUserTeam,
    setEditUserTeam,
    userLoading,
    deleteUser,
    openEditUser,
    saveEditUser,
    inviteUser
  } = useAdminUsers({
    profile,
    initialUsers,
    supabase,
    onInviteCompleted: () => setShowInviteUser(false),
    onEditCompleted: () => setShowEditUser(false),
    onOpenEdit: () => setShowEditUser(true)
  })

  const {
    instructions,
    folders,
    selectedFolder,
    statusFilter,
    newFolderName,
    newInstruction,
    selectedFile,
    editingInstruction,
    editInstructionTitle,
    editInstructionContent,
    editInstructionSeverity,
    editInstructionStatus,
    editInstructionFolder,
    instructionLoading,
    folderLoading,
    filteredInstructions,
    setSelectedFolder,
    setStatusFilter,
    setNewFolderName,
    setNewInstruction,
    setSelectedFile,
    setEditInstructionTitle,
    setEditInstructionContent,
    setEditInstructionSeverity,
    setEditInstructionStatus,
    setEditInstructionFolder,
    createFolder,
    deleteFolder,
    createInstruction,
    deleteInstruction,
    toggleInstructionStatus,
    openEditInstruction,
    saveEditInstruction
  } = useAdminInstructions({
    profile,
    initialInstructions,
    initialFolders,
    supabase,
    onCloseCreateInstruction: () => setShowCreateInstruction(false),
    onCloseEditInstruction: () => setShowEditInstruction(false),
    onOpenEditInstruction: () => setShowEditInstruction(true),
    onCloseCreateFolder: () => setShowCreateFolder(false)
  })

  const {
    alerts,
    newAlert,
    alertLoading,
    setNewAlert,
    createAlert,
    toggleAlert,
    deleteAlert
  } = useAdminAlerts({
    profile,
    initialAlerts,
    supabase,
    onCloseCreateAlert: () => setShowCreateAlert(false)
  })

  const {
    auditLogs,
    auditLogsLoading,
    auditFilter,
    setAuditFilter,
    loadAuditLogs
  } = useAuditLogs()

  const {
    readReport,
    readReportLoading,
    expandedInstructions,
    loadReadReport,
    toggleInstructionExpansion
  } = useReadReport()

  useEffect(() => {
    if (tab === 'auditlog') {
      loadAuditLogs()
    }
  }, [tab, loadAuditLogs])

  useEffect(() => {
    if (tab === 'lesebekreftelser') {
      loadReadReport()
    }
  }, [tab, loadReadReport])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const styles = createAdminStyles(isMobile)

  return (
    <>
      <AuthWatcher />
      <div style={styles.container}>
        <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isMobile && (
            <button
              style={styles.mobileMenuBtn}
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
          {!isMobile && <span style={styles.orgName}>{organization.name}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && (
            <button
              style={styles.btnSmall}
              onClick={() => setShowDisclaimer(true)}
              title="Om AI-assistenten"
            >
              <Info size={14} style={{ marginRight: 4 }} />
              AI-info
            </button>
          )}
          {!isMobile && <span style={{ fontSize: 14, color: '#64748B' }}>{profile.full_name}</span>}
          <button style={styles.logoutBtn} onClick={handleLogout}>
            {isMobile ? <LogOut size={18} /> : <><LogOut size={16} style={{ marginRight: 6 }} />Logg ut</>}
          </button>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.sidebar(showMobileMenu)}>
          <button style={styles.navItem(tab === 'oversikt')} onClick={() => { setTab('oversikt'); setShowMobileMenu(false); }}>
            <Home size={18} style={styles.navIcon(tab === 'oversikt')} />
            Oversikt
          </button>
          <button style={styles.navItem(tab === 'brukere')} onClick={() => { setTab('brukere'); setShowMobileMenu(false); }}>
            <Users size={18} style={styles.navIcon(tab === 'brukere')} />
            Brukere
          </button>
          <button style={styles.navItem(tab === 'team')} onClick={() => { setTab('team'); setShowMobileMenu(false); }}>
            <UsersRound size={18} style={styles.navIcon(tab === 'team')} />
            Team
          </button>
          <button style={styles.navItem(tab === 'instrukser')} onClick={() => { setTab('instrukser'); setShowMobileMenu(false); }}>
            <FileText size={18} style={styles.navIcon(tab === 'instrukser')} />
            Instrukser
          </button>
          <button style={styles.navItem(tab === 'avvik')} onClick={() => { setTab('avvik'); setShowMobileMenu(false); }}>
            <AlertTriangle size={18} style={styles.navIcon(tab === 'avvik')} />
            Avvik & Varsler
          </button>
          <button style={styles.navItem(tab === 'ailogg')} onClick={() => { setTab('ailogg'); setShowMobileMenu(false); }}>
            <Bot size={18} style={styles.navIcon(tab === 'ailogg')} />
            AI-logg
          </button>
          <button style={styles.navItem(tab === 'innsikt')} onClick={() => { setTab('innsikt'); setShowMobileMenu(false); }}>
            <BarChart3 size={18} style={styles.navIcon(tab === 'innsikt')} />
            Innsikt
          </button>
          <button style={styles.navItem(tab === 'auditlog')} onClick={() => { setTab('auditlog'); setShowMobileMenu(false); }}>
            <ClipboardList size={18} style={styles.navIcon(tab === 'auditlog')} />
            Aktivitetslogg
          </button>
          <button style={styles.navItem(tab === 'lesebekreftelser')} onClick={() => { setTab('lesebekreftelser'); setShowMobileMenu(false); }}>
            <CheckSquare size={18} style={styles.navIcon(tab === 'lesebekreftelser')} />
            Lesebekreftelser
          </button>
        </aside>

        <main style={styles.content}>
          {tab === 'oversikt' && (
            <OverviewTab
              profile={profile}
              users={users}
              instructions={instructions}
              alerts={alerts}
              styles={styles}
              setTab={setTab}
            />
          )}

          {tab === 'brukere' && (
            <UsersTab
              profile={profile}
              users={users}
              teams={teams}
              styles={styles}
              openEditUser={openEditUser}
              deleteUser={deleteUser}
              setShowInviteUser={setShowInviteUser}
            />
          )}

          {tab === 'team' && (
            <TeamsTab
              teams={teams}
              users={users}
              styles={styles}
              deleteTeam={deleteTeam}
              setShowCreateTeam={setShowCreateTeam}
            />
          )}

          {tab === 'instrukser' && (
            <InstructionsTab
              instructions={instructions}
              folders={folders}
              filteredInstructions={filteredInstructions}
              selectedFolder={selectedFolder}
              statusFilter={statusFilter}
              styles={styles}
              setSelectedFolder={setSelectedFolder}
              setStatusFilter={setStatusFilter}
              toggleInstructionStatus={toggleInstructionStatus}
              openEditInstruction={openEditInstruction}
              deleteInstruction={deleteInstruction}
              deleteFolder={deleteFolder}
              setShowCreateInstruction={setShowCreateInstruction}
              setShowCreateFolder={setShowCreateFolder}
            />
          )}

          {tab === 'avvik' && (
            <AlertsTab
              alerts={alerts}
              styles={styles}
              toggleAlert={toggleAlert}
              deleteAlert={deleteAlert}
              setShowCreateAlert={setShowCreateAlert}
            />
          )}

          {tab === 'ailogg' && (
            <AiLogTab
              aiLogs={aiLogs}
              styles={styles}
            />
          )}

          {tab === 'innsikt' && (
            <InsightsTab
              aiLogs={aiLogs}
              instructions={instructions}
              styles={styles}
            />
          )}

          {tab === 'auditlog' && (
            <AuditLogTab
              auditLogs={auditLogs}
              auditLogsLoading={auditLogsLoading}
              auditFilter={auditFilter}
              styles={styles}
              setAuditFilter={setAuditFilter}
              loadAuditLogs={loadAuditLogs}
            />
          )}

          {tab === 'lesebekreftelser' && (
            <ReadConfirmationsTab
              readReport={readReport}
              readReportLoading={readReportLoading}
              expandedInstructions={expandedInstructions}
              styles={styles}
              toggleInstructionExpansion={toggleInstructionExpansion}
            />
          )}
        </main>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div style={styles.modal} onClick={() => setShowCreateTeam(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett team</h2>
            <label style={styles.label}>Teamnavn</label>
            <input style={styles.input} value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="F.eks. Lager, Butikk" />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateTeam(false)}>Avbryt</button>
              <button style={{...styles.btn, ...(teamLoading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={createTeam} disabled={teamLoading}>{teamLoading ? 'Oppretter...' : 'Opprett'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div style={styles.modal} onClick={() => setShowCreateFolder(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett mappe</h2>
            <label style={styles.label}>Mappenavn</label>
            <input style={styles.input} value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="F.eks. Brann, HMS" />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateFolder(false)}>Avbryt</button>
              <button style={{...styles.btn, ...(folderLoading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={createFolder} disabled={folderLoading}>{folderLoading ? 'Oppretter...' : 'Opprett'}</button>
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
            <input style={styles.input} value={newInstruction.title} onChange={e => setNewInstruction({ ...newInstruction, title: e.target.value })} placeholder="F.eks. Brannrutiner" />

            <label style={styles.label}>Mappe</label>
            <select style={styles.select} value={newInstruction.folderId} onChange={e => setNewInstruction({ ...newInstruction, folderId: e.target.value })}>
              <option value="">Ingen mappe</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>

            <label style={styles.label}>Status</label>
            <select style={styles.select} value={newInstruction.status} onChange={e => setNewInstruction({ ...newInstruction, status: e.target.value })}>
              <option value="draft">Utkast (ikke synlig for ansatte)</option>
              <option value="published">Publisert (synlig for ansatte og AI)</option>
            </select>
            
            <label style={styles.label}>Innhold (brukes av AI)
              <span style={{ fontSize: 12, fontWeight: 400, color: '#64748B', marginLeft: 8 }}>
                • Valgfritt hvis du laster opp PDF. AI kan kun svare basert på tekst du skriver her.
              </span>
            </label>
            <textarea
              style={styles.textarea}
              value={newInstruction.content}
              onChange={e => setNewInstruction({ ...newInstruction, content: e.target.value })}
              placeholder="Skriv eller lim inn tekst fra PDF her for at AI skal kunne svare på spørsmål om denne instruksen..."
              rows={8}
            />
            
            <label style={styles.label}>Alvorlighet</label>
            <select style={styles.select} value={newInstruction.severity} onChange={e => setNewInstruction({ ...newInstruction, severity: e.target.value })}>
              <option value="critical">Kritisk</option>
              <option value="medium">Middels</option>
              <option value="low">Lav</option>
            </select>

            <label style={styles.label}>Vedlegg (PDF)</label>
            <input type="file" accept=".pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ marginBottom: 16 }} />
            {selectedFile && <p style={{ fontSize: 13, color: '#10B981', marginBottom: 16 }}>✓ {selectedFile.name}</p>}

            <label style={styles.label}>Team</label>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={newInstruction.allTeams} onChange={e => setNewInstruction({ ...newInstruction, allTeams: e.target.checked, teamIds: [] })} />
                <span>Alle team</span>
              </label>
              {!newInstruction.allTeams && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {teams.map(team => (
                    <button key={team.id} type="button" onClick={() => {
                      const ids = newInstruction.teamIds.includes(team.id) ? newInstruction.teamIds.filter(id => id !== team.id) : [...newInstruction.teamIds, team.id]
                      setNewInstruction({ ...newInstruction, teamIds: ids })
                    }} style={styles.teamChip(newInstruction.teamIds.includes(team.id))}>{team.name}</button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateInstruction(false)}>Avbryt</button>
              <button style={{...styles.btn, ...(instructionLoading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={createInstruction} disabled={instructionLoading}>{instructionLoading ? 'Oppretter...' : 'Opprett'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Instruction Modal */}
      {showEditInstruction && editingInstruction && (
        <div style={styles.modal} onClick={() => setShowEditInstruction(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Rediger instruks</h2>
            
            <label style={styles.label}>Tittel</label>
            <input style={styles.input} value={editInstructionTitle} onChange={e => setEditInstructionTitle(e.target.value)} />

            <label style={styles.label}>Mappe</label>
            <select style={styles.select} value={editInstructionFolder} onChange={e => setEditInstructionFolder(e.target.value)}>
              <option value="">Ingen mappe</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>

            <label style={styles.label}>Status</label>
            <select style={styles.select} value={editInstructionStatus} onChange={e => setEditInstructionStatus(e.target.value)}>
              <option value="draft">Utkast</option>
              <option value="published">Publisert</option>
            </select>
            
            <label style={styles.label}>Innhold</label>
            <textarea style={styles.textarea} value={editInstructionContent} onChange={e => setEditInstructionContent(e.target.value)} />
            
            <label style={styles.label}>Alvorlighet</label>
            <select style={styles.select} value={editInstructionSeverity} onChange={e => setEditInstructionSeverity(e.target.value)}>
              <option value="critical">Kritisk</option>
              <option value="medium">Middels</option>
              <option value="low">Lav</option>
            </select>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowEditInstruction(false)}>Avbryt</button>
              <button style={{...styles.btn, ...(instructionLoading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={saveEditInstruction} disabled={instructionLoading}>{instructionLoading ? 'Lagrer...' : 'Lagre'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteUser && (
        <div style={styles.modal} onClick={() => setShowInviteUser(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Lag invitasjonslenke</h2>

            <label style={styles.label}>E-post (kun for referanse)</label>
            <input style={styles.input} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="bruker@bedrift.no" />
            <p style={{ fontSize: 13, color: '#64748B', marginTop: -12, marginBottom: 16 }}>
              E-posten lagres ikke i databasen. Den brukes kun for logging og referanse.
            </p>
            
            <label style={styles.label}>Rolle</label>
            <select style={styles.select} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="employee">Ansatt</option>
              <option value="teamleader">Teamleder</option>
              <option value="admin">Sikkerhetsansvarlig</option>
            </select>

            <label style={styles.label}>Team</label>
            <select style={styles.select} value={inviteTeam} onChange={e => setInviteTeam(e.target.value)}>
              <option value="">Velg team...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowInviteUser(false)}>Avbryt</button>
              <button style={{...styles.btn, ...(userLoading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={inviteUser} disabled={userLoading}>{userLoading ? 'Sender...' : 'Opprett invitasjon'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div style={styles.modal} onClick={() => setShowEditUser(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Rediger bruker</h2>
            <p style={{ color: '#64748B', marginBottom: 16 }}>{editingUser.full_name}</p>
            
            <label style={styles.label}>Rolle</label>
            <select style={styles.select} value={editUserRole} onChange={e => setEditUserRole(e.target.value)}>
              <option value="employee">Ansatt</option>
              <option value="teamleader">Teamleder</option>
              <option value="admin">Sikkerhetsansvarlig</option>
            </select>

            <label style={styles.label}>Team</label>
            <select style={styles.select} value={editUserTeam} onChange={e => setEditUserTeam(e.target.value)}>
              <option value="">Ingen team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowEditUser(false)}>Avbryt</button>
              <button style={{...styles.btn, ...(userLoading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={saveEditUser} disabled={userLoading}>{userLoading ? 'Lagrer...' : 'Lagre'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <div style={styles.modal} onClick={() => setShowCreateAlert(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett avvik</h2>
            
            <label style={styles.label}>Tittel</label>
            <input style={styles.input} value={newAlert.title} onChange={e => setNewAlert({ ...newAlert, title: e.target.value })} placeholder="F.eks. Stengt nødutgang" />
            
            <label style={styles.label}>Beskrivelse</label>
            <textarea style={styles.textarea} value={newAlert.description} onChange={e => setNewAlert({ ...newAlert, description: e.target.value })} />
            
            <label style={styles.label}>Alvorlighet</label>
            <select style={styles.select} value={newAlert.severity} onChange={e => setNewAlert({ ...newAlert, severity: e.target.value })}>
              <option value="critical">Kritisk</option>
              <option value="medium">Middels</option>
              <option value="low">Lav</option>
            </select>

            <label style={styles.label}>Synlig for</label>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={newAlert.allTeams} onChange={e => setNewAlert({ ...newAlert, allTeams: e.target.checked, teamIds: [] })} />
                <span>Alle team</span>
              </label>
              {!newAlert.allTeams && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {teams.map(team => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        const ids = newAlert.teamIds.includes(team.id)
                          ? newAlert.teamIds.filter(id => id !== team.id)
                          : [...newAlert.teamIds, team.id]
                        setNewAlert({ ...newAlert, teamIds: ids })
                      }}
                      style={styles.teamChip(newAlert.teamIds.includes(team.id))}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateAlert(false)}>Avbryt</button>
              <button style={{...styles.btn, ...(alertLoading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={createAlert} disabled={alertLoading}>{alertLoading ? 'Oppretter...' : 'Opprett'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div style={styles.modal} onClick={() => setShowDisclaimer(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>ℹ️ Om AI-assistenten</h2>
            
            <div style={styles.disclaimer}>
              <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Ansvarsfraskrivelse</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                Tetra AI er et <strong>støtteverktøy</strong> som hjelper ansatte med å finne informasjon i bedriftens instrukser og prosedyrer.
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
                AI-assistenten svarer <strong>kun basert på publiserte dokumenter</strong> i systemet. Den bruker ikke ekstern kunnskap eller generell informasjon.
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: '#92400E' }}>
                <strong>Viktig:</strong> AI-svar er ikke juridisk bindende eller operativ fasit. Ved tvil, kontakt alltid ansvarlig leder.
              </p>
            </div>

            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Logging</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
              Alle spørsmål og svar logges for kvalitetssikring. Loggene er kun tilgjengelige for administratorer.
            </p>

            <button style={styles.btn} onClick={() => setShowDisclaimer(false)}>Lukk</button>
          </div>
        </div>
      )}
      </div>
    </>
  )
}
