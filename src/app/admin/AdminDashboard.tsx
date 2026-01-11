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
  CreateAlertModal,
  CreateFolderModal,
  CreateInstructionModal,
  CreateTeamModal,
  DisclaimerModal,
  EditInstructionModal,
  EditUserModal,
  InviteUserModal
} from './components/modals'
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
      </div>

      <CreateTeamModal
        open={showCreateTeam}
        styles={styles}
        newTeamName={newTeamName}
        setNewTeamName={setNewTeamName}
        onClose={() => setShowCreateTeam(false)}
        onCreate={createTeam}
        loading={teamLoading}
      />

      <CreateFolderModal
        open={showCreateFolder}
        styles={styles}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onClose={() => setShowCreateFolder(false)}
        onCreate={createFolder}
        loading={folderLoading}
      />

      <CreateInstructionModal
        open={showCreateInstruction}
        styles={styles}
        folders={folders}
        teams={teams}
        newInstruction={newInstruction}
        selectedFile={selectedFile}
        setNewInstruction={setNewInstruction}
        setSelectedFile={setSelectedFile}
        instructionLoading={instructionLoading}
        createInstruction={createInstruction}
        onClose={() => setShowCreateInstruction(false)}
      />

      <EditInstructionModal
        open={showEditInstruction}
        styles={styles}
        folders={folders}
        editingInstruction={editingInstruction}
        editInstructionTitle={editInstructionTitle}
        setEditInstructionTitle={setEditInstructionTitle}
        editInstructionContent={editInstructionContent}
        setEditInstructionContent={setEditInstructionContent}
        editInstructionSeverity={editInstructionSeverity}
        setEditInstructionSeverity={setEditInstructionSeverity}
        editInstructionStatus={editInstructionStatus}
        setEditInstructionStatus={setEditInstructionStatus}
        editInstructionFolder={editInstructionFolder}
        setEditInstructionFolder={setEditInstructionFolder}
        instructionLoading={instructionLoading}
        saveEditInstruction={saveEditInstruction}
        onClose={() => setShowEditInstruction(false)}
      />

      <InviteUserModal
        open={showInviteUser}
        styles={styles}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        inviteTeam={inviteTeam}
        setInviteTeam={setInviteTeam}
        teams={teams}
        userLoading={userLoading}
        inviteUser={inviteUser}
        onClose={() => setShowInviteUser(false)}
      />

      <EditUserModal
        open={showEditUser}
        styles={styles}
        editingUser={editingUser}
        editUserRole={editUserRole}
        setEditUserRole={setEditUserRole}
        editUserTeam={editUserTeam}
        setEditUserTeam={setEditUserTeam}
        teams={teams}
        userLoading={userLoading}
        saveEditUser={saveEditUser}
        onClose={() => setShowEditUser(false)}
      />

      <CreateAlertModal
        open={showCreateAlert}
        styles={styles}
        newAlert={newAlert}
        setNewAlert={setNewAlert}
        teams={teams}
        alertLoading={alertLoading}
        createAlert={createAlert}
        onClose={() => setShowCreateAlert(false)}
      />

      <DisclaimerModal
        open={showDisclaimer}
        styles={styles}
        onClose={() => setShowDisclaimer(false)}
      />
    </>
  )
}
