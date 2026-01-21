'use client'

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
  CheckSquare
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
} from './components/modals/'
import {
  useAdminAlerts,
  useAdminInstructions,
  useAdminTeams,
  useAdminUsers,
  useAuditLogs,
  useReadReport
} from './hooks'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar, type SidebarTab } from '@/components/layout/AppSidebar'

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
    cleanupInviteData()
  }, [])

  const {
    teams,
    teamMemberCounts,
    newTeamName,
    setNewTeamName,
    createTeam,
    deleteTeam,
    teamsHasMore,
    teamsLoadingMore,
    loadMoreTeams,
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
    inviteUser,
    usersHasMore,
    usersLoadingMore,
    loadMoreUsers
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
    editInstructionTeams,
    instructionLoading,
    folderLoading,
    instructionsHasMore,
    instructionsLoadingMore,
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
    setEditInstructionTeams,
    createFolder,
    deleteFolder,
    createInstruction,
    deleteInstruction,
    toggleInstructionStatus,
    openEditInstruction,
    saveEditInstruction,
    loadMoreInstructions
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
    deleteAlert,
    alertsHasMore,
    alertsLoadingMore,
    loadMoreAlerts
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
    loadAuditLogs,
    pagination,
    currentPage: auditCurrentPage,
    totalPages: auditTotalPages,
    goToPage: goToAuditPage
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

  /* ... inside component ... */

  const adminTabs: SidebarTab[] = [
    { id: 'oversikt', label: 'Oversikt', icon: Home },
    { id: 'brukere', label: 'Brukere', icon: Users },
    { id: 'team', label: 'Team', icon: UsersRound },
    { id: 'instrukser', label: 'Instrukser', icon: FileText },
    { id: 'avvik', label: 'Avvik & Varsler', icon: AlertTriangle },
    { id: 'ailogg', label: 'AI-logg', icon: Bot },
    { id: 'innsikt', label: 'Innsikt', icon: BarChart3 },
    { id: 'auditlog', label: 'Aktivitetslogg', icon: ClipboardList },
    { id: 'lesebekreftelser', label: 'Lesebekreftelser', icon: CheckSquare },
  ]

  return (
    <>
      <AuthWatcher />
      <div className="min-h-screen bg-background">
        <AppHeader
          onMenuClick={() => setShowMobileMenu(true)}
          user={{
            name: profile.full_name || 'Bruker',
            email: profile.email || '',
            image: ''
          }}
          organizationName={organization.name}
          onLogout={handleLogout}
          onDisclaimer={() => setShowDisclaimer(true)}
        />
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          <AppSidebar
            tabs={adminTabs}
            activeTab={tab}
            onTabChange={(t) => handleTabChange(t as typeof tab)}
            open={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
          />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-secondary/10">
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
                usersHasMore={usersHasMore}
                usersLoadingMore={usersLoadingMore}
                loadMoreUsers={loadMoreUsers}
              />
            )}

            {tab === 'team' && (
              <TeamsTab
                teams={teams}
                users={users}
                deleteTeam={deleteTeam}
                setShowCreateTeam={setShowCreateTeam}
                teamMemberCounts={teamMemberCounts}
                teamsHasMore={teamsHasMore}
                teamsLoadingMore={teamsLoadingMore}
                loadMoreTeams={loadMoreTeams}
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
                instructionsHasMore={instructionsHasMore}
                instructionsLoadingMore={instructionsLoadingMore}
                loadMoreInstructions={loadMoreInstructions}
              />
            )}

            {tab === 'avvik' && (
              <AlertsTab
                alerts={alerts}
                toggleAlert={toggleAlert}
                deleteAlert={deleteAlert}
                setShowCreateAlert={setShowCreateAlert}
                alertsHasMore={alertsHasMore}
                alertsLoadingMore={alertsLoadingMore}
                loadMoreAlerts={loadMoreAlerts}
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
                auditTotal={pagination.total}
                currentPage={auditCurrentPage}
                totalPages={auditTotalPages}
                goToPage={goToAuditPage}
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
        teams={teams}
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
        editInstructionTeams={editInstructionTeams}
        setEditInstructionTeams={setEditInstructionTeams}
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
