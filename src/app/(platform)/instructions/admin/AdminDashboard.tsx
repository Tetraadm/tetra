"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cleanupInviteData } from "@/lib/invite-cleanup";
import AuthWatcher from "@/components/AuthWatcher";
import type {
  Profile,
  Organization,
  Team,
  Instruction,
  Folder,
  Alert,
  UnansweredQuestion,
} from "@/lib/types";
import {
  OverviewTab,
  UsersTab,
  TeamsTab,
  InstructionsTab,
  AlertsTab,
  AiLogTab,
  InsightsTab,
  AuditLogTab,
  ReadConfirmationsTab,
  GdprTab,
} from "./tabs";
import {
  CreateAlertModal,
  CreateFolderModal,
  CreateInstructionModal,
  CreateTeamModal,
  DisclaimerModal,
  EditInstructionModal,
  EditUserModal,
  InviteUserModal,
} from "./components/modals/";
import {
  useAdminAlerts,
  useAdminInstructions,
  useAdminTeams,
  useAdminUsers,
  useAuditLogs,
  useReadReport,
} from "./hooks";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminHeader } from "@/components/layout/AdminHeader";

type Props = {
  profile: Profile;
  organization: Organization;
  teams: Team[];
  users: Profile[];
  instructions: Instruction[];
  folders: Folder[];
  alerts: Alert[];
  unansweredQuestions: UnansweredQuestion[];
};

export default function AdminDashboard({
  profile,
  organization,
  teams: initialTeams,
  users: initialUsers,
  instructions: initialInstructions,
  folders: initialFolders,
  alerts: initialAlerts,
  unansweredQuestions,
}: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [tab, setTab] = useState<
    | "oversikt"
    | "brukere"
    | "team"
    | "instrukser"
    | "kunngjøringer"
    | "ubesvarte"
    | "innsikt"
    | "aktivitetslogg"
    | "lesebekreftelser"
    | "gdpr"
  >("oversikt");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateInstruction, setShowCreateInstruction] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showEditInstruction, setShowEditInstruction] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    cleanupInviteData();
  }, []);

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
    teamLoading,
  } = useAdminTeams({
    profile,
    initialTeams,
    supabase,
    onCloseCreateTeam: () => setShowCreateTeam(false),
  });

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
    loadMoreUsers,
  } = useAdminUsers({
    profile,
    initialUsers,
    supabase,
    onInviteCompleted: () => setShowInviteUser(false),
    onEditCompleted: () => setShowEditUser(false),
    onOpenEdit: () => setShowEditUser(true),
  });

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
    loadMoreInstructions,
  } = useAdminInstructions({
    profile,
    initialInstructions,
    initialFolders,
    supabase,
    onCloseCreateInstruction: () => setShowCreateInstruction(false),
    onCloseEditInstruction: () => setShowEditInstruction(false),
    onOpenEditInstruction: () => setShowEditInstruction(true),
    onCloseCreateFolder: () => setShowCreateFolder(false),
  });

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
    loadMoreAlerts,
  } = useAdminAlerts({
    profile,
    initialAlerts,
    supabase,
    onCloseCreateAlert: () => setShowCreateAlert(false),
  });

  const {
    auditLogs,
    auditLogsLoading,
    auditFilter,
    setAuditFilter,
    loadAuditLogs,
    pagination,
    currentPage: auditCurrentPage,
    totalPages: auditTotalPages,
    goToPage: goToAuditPage,
  } = useAuditLogs();

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
    totalPages,
  } = useReadReport();

  useEffect(() => {
    if (tab === "aktivitetslogg") {
      loadAuditLogs();
    }
  }, [tab, loadAuditLogs]);

  useEffect(() => {
    if (tab === "lesebekreftelser") {
      loadReadReport();
    }
  }, [tab, loadReadReport]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      <AuthWatcher />
      <div className="min-h-screen bg-background flex">
        {/* Admin Sidebar */}
        <AdminSidebar
          activeTab={tab}
          onTabChange={(t) => setTab(t as typeof tab)}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          unansweredCount={unansweredQuestions.length}
        />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "ml-[72px]" : "ml-64"
            }`}
        >
          {/* Admin Header */}
          <AdminHeader
            userName={profile.full_name || "Admin"}
            userEmail={profile.email || ""}
            onLogout={handleLogout}
            sidebarCollapsed={sidebarCollapsed}
            onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            organizationName={organization.name}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto px-6 pb-6 pt-20 bg-gradient-to-b from-background via-background to-muted/30">
            {tab === "oversikt" && (
              <OverviewTab
                profile={profile}
                users={users}
                instructions={instructions}
                alerts={alerts}
                unansweredCount={unansweredQuestions.length}
                setTab={setTab}
              />
            )}

            {tab === "brukere" && (
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

            {tab === "team" && (
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

            {tab === "instrukser" && (
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

            {tab === "kunngjøringer" && (
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

            {tab === "ubesvarte" && (
              <AiLogTab unansweredQuestions={unansweredQuestions} />
            )}

            {tab === "innsikt" && (
              <InsightsTab
                unansweredQuestions={unansweredQuestions}
                instructions={instructions}
              />
            )}

            {tab === "aktivitetslogg" && (
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

            {tab === "lesebekreftelser" && (
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

            {tab === "gdpr" && <GdprTab />}
          </main>
        </div>
      </div>

      {/* Modals */}
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
  );
}
