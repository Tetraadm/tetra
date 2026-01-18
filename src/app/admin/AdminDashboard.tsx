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
// Nordic Technical styles via CSS variables (no need for createAdminStyles)
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
    userReads,
    userReadsLoading,
    loadReadReport,
    toggleInstructionExpansion,
    goToPage,
    currentPage,
    totalPages
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

  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab)
    setShowMobileMenu(false)
  }

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
              <span className="nt-app-org-badge">{organization.name}</span>
            )}
          </div>
          <div className="nt-app-header__actions">
            {!isMobile && (
              <button
                className="nt-btn nt-btn-secondary nt-btn-sm"
                onClick={() => setShowDisclaimer(true)}
                title="Om AI-assistenten"
              >
                <Info size={14} />
                AI-info
              </button>
            )}
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
                className={`nt-nav-item ${tab === 'brukere' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('brukere')}
              >
                <Users size={18} aria-hidden="true" />
                Brukere
              </button>
              <button
                className={`nt-nav-item ${tab === 'team' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('team')}
              >
                <UsersRound size={18} aria-hidden="true" />
                Team
              </button>
              <button
                className={`nt-nav-item ${tab === 'instrukser' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('instrukser')}
              >
                <FileText size={18} aria-hidden="true" />
                Instrukser
              </button>
              <button
                className={`nt-nav-item ${tab === 'avvik' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('avvik')}
              >
                <AlertTriangle size={18} aria-hidden="true" />
                Avvik & Varsler
              </button>
              <button
                className={`nt-nav-item ${tab === 'ailogg' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('ailogg')}
              >
                <Bot size={18} aria-hidden="true" />
                AI-logg
              </button>
              <button
                className={`nt-nav-item ${tab === 'innsikt' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('innsikt')}
              >
                <BarChart3 size={18} aria-hidden="true" />
                Innsikt
              </button>
              <button
                className={`nt-nav-item ${tab === 'auditlog' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('auditlog')}
              >
                <ClipboardList size={18} aria-hidden="true" />
                Aktivitetslogg
              </button>
              <button
                className={`nt-nav-item ${tab === 'lesebekreftelser' ? 'nt-nav-item--active' : ''}`}
                onClick={() => handleTabChange('lesebekreftelser')}
              >
                <CheckSquare size={18} aria-hidden="true" />
                Lesebekreftelser
              </button>
            </nav>
          </aside>

          <main className="nt-app-content">
            {tab === 'oversikt' && (
              <OverviewTab
                profile={profile}
                users={users}
                instructions={instructions}
                alerts={alerts}
                setTab={setTab}
              />
            )}

            {tab === 'brukere' && (
              <UsersTab
                profile={profile}
                users={users}
                teams={teams}
                openEditUser={openEditUser}
                deleteUser={deleteUser}
                setShowInviteUser={setShowInviteUser}
              />
            )}

            {tab === 'team' && (
              <TeamsTab
                teams={teams}
                users={users}
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
                toggleAlert={toggleAlert}
                deleteAlert={deleteAlert}
                setShowCreateAlert={setShowCreateAlert}
              />
            )}

            {tab === 'ailogg' && (
              <AiLogTab
                aiLogs={aiLogs}
              />
            )}

            {tab === 'innsikt' && (
              <InsightsTab
                aiLogs={aiLogs}
                instructions={instructions}
              />
            )}

            {tab === 'auditlog' && (
              <AuditLogTab
                auditLogs={auditLogs}
                auditLogsLoading={auditLogsLoading}
                auditFilter={auditFilter}
                setAuditFilter={setAuditFilter}
                loadAuditLogs={loadAuditLogs}
              />
            )}

            {tab === 'lesebekreftelser' && (
              <ReadConfirmationsTab
                readReport={readReport}
                readReportLoading={readReportLoading}
                expandedInstructions={expandedInstructions}
                userReads={userReads}
                userReadsLoading={userReadsLoading}
                toggleInstructionExpansion={toggleInstructionExpansion}
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={goToPage}
              />
            )}
          </main>
        </div>
      </div>

      <CreateTeamModal
        open={showCreateTeam}
        newTeamName={newTeamName}
        setNewTeamName={setNewTeamName}
        onClose={() => setShowCreateTeam(false)}
        onCreate={createTeam}
        loading={teamLoading}
      />

      <CreateFolderModal
        open={showCreateFolder}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onClose={() => setShowCreateFolder(false)}
        onCreate={createFolder}
        loading={folderLoading}
      />

      <CreateInstructionModal
        open={showCreateInstruction}
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
        newAlert={newAlert}
        setNewAlert={setNewAlert}
        teams={teams}
        alertLoading={alertLoading}
        createAlert={createAlert}
        onClose={() => setShowCreateAlert(false)}
      />

      <DisclaimerModal
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />
    </>
  )
}
