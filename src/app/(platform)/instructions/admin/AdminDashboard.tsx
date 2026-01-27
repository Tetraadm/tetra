"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
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
  EditAlertModal,
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { roleLabel } from "@/lib/ui-helpers";

type Props = {
  profile: Profile;
  organization: Organization;
  teams: Team[];
  users: Profile[];
  instructions: Instruction[];
  folders: Folder[];
  alerts: Alert[];
  unansweredQuestions: UnansweredQuestion[];
  gdprPendingCount: number;
  insightStats: {
    instructionsOpened: number;
    aiQuestions: number;
    unanswered: number;
  };
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
  gdprPendingCount,
  insightStats,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showCreateInstruction, setShowCreateInstruction] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showEditInstruction, setShowEditInstruction] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [currentGdprCount, setCurrentGdprCount] = useState(gdprPendingCount);

  useEffect(() => {
    cleanupInviteData();
  }, []);

  useEffect(() => {
    if (currentGdprCount > 0) {
      const label = currentGdprCount === 1
        ? "1 sletteforespørsel"
        : `${currentGdprCount} sletteforespørsler`
      toast(`Du har ${label} som venter på behandling.`, {
        id: "gdpr-pending",
      })
    }
  }, [currentGdprCount])

  const searchValue = searchQuery.trim().toLowerCase();

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
    openEditAlert,
    saveEditAlert,
    editingAlert,
    editAlertTitle,
    setEditAlertTitle,
    editAlertDescription,
    setEditAlertDescription,
    editAlertSeverity,
    setEditAlertSeverity,
    editAlertTeams,
    setEditAlertTeams,
    editAlertAllTeams,
    setEditAlertAllTeams,
    alertsHasMore,
    alertsLoadingMore,
    loadMoreAlerts,
  } = useAdminAlerts({
    profile,
    initialAlerts,
    supabase,
    onCloseCreateAlert: () => setShowCreateAlert(false),
    onCloseEditAlert: () => setShowEditAlert(false),
    onOpenEditAlert: () => setShowEditAlert(true),
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

  const searchedInstructions = useMemo(() => {
    if (!searchValue) return filteredInstructions;
    return filteredInstructions.filter((instruction) => {
      const haystack = [
        instruction.title,
        instruction.content,
        instruction.folders?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(searchValue);
    });
  }, [filteredInstructions, searchValue]);

  const searchedAlerts = useMemo(() => {
    if (!searchValue) return alerts;
    return alerts.filter((alert) => {
      const haystack = `${alert.title} ${alert.description || ""}`.toLowerCase();
      return haystack.includes(searchValue);
    });
  }, [alerts, searchValue]);

  // Don't show notification count when on the alerts tab
  const activeAlertCount = useMemo(() => {
    if (tab === "kunngjøringer") return 0;
    return alerts.filter((alert) => alert.active).length;
  }, [alerts, tab]);

  const searchedTeams = useMemo(() => {
    if (!searchValue) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(searchValue));
  }, [teams, searchValue]);

  const searchedUnansweredQuestions = useMemo(() => {
    if (!searchValue) return unansweredQuestions;
    return unansweredQuestions.filter((question) => {
      const haystack = `${question.question} ${question.profiles?.full_name || ""}`.toLowerCase();
      return haystack.includes(searchValue);
    });
  }, [unansweredQuestions, searchValue]);

  // Global search results for dropdown
  const globalSearchResults = useMemo(() => {
    if (!searchValue || searchValue.length < 2) return [];

    const results: Array<{
      id: string;
      title: string;
      type: "instruction" | "user" | "alert" | "team";
      tab: string;
    }> = [];

    // Search instructions
    instructions.forEach((instruction) => {
      if (instruction.title.toLowerCase().includes(searchValue)) {
        results.push({
          id: instruction.id,
          title: instruction.title,
          type: "instruction",
          tab: "instrukser",
        });
      }
    });

    // Search users
    users.forEach((user) => {
      const name = user.full_name || user.email || "";
      if (name.toLowerCase().includes(searchValue)) {
        results.push({
          id: user.id,
          title: name,
          type: "user",
          tab: "brukere",
        });
      }
    });

    // Search alerts
    alerts.forEach((alert) => {
      if (alert.title.toLowerCase().includes(searchValue)) {
        results.push({
          id: alert.id,
          title: alert.title,
          type: "alert",
          tab: "kunngjøringer",
        });
      }
    });

    // Search teams
    teams.forEach((team) => {
      if (team.name.toLowerCase().includes(searchValue)) {
        results.push({
          id: team.id,
          title: team.name,
          type: "team",
          tab: "team",
        });
      }
    });

    return results;
  }, [searchValue, instructions, users, alerts, teams]);

  const handleSearchResultClick = useCallback((result: { tab: string }) => {
    setTab(result.tab as typeof tab);
  }, []);

  const isMissingSessionError = (error: { name?: string; message?: string }) => {
    if (error.name === "AuthSessionMissingError") {
      return true;
    }
    const message = error.message?.toLowerCase() ?? "";
    return message.includes("session") && (message.includes("missing") || message.includes("not found"));
  };

  const handleLogout = async () => {
    // Signal intentional logout to prevent "session expired" error message
    window.dispatchEvent(new CustomEvent('intentional-logout'));
    const { error } = await supabase.auth.signOut();
    if (error && !isMissingSessionError(error)) {
      toast.error("Kunne ikke logge ut. Prøv igjen.");
      return;
    }
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
          gdprPendingCount={currentGdprCount}
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchResults={globalSearchResults}
            onSearchResultClick={handleSearchResultClick}
            onOpenProfile={() => setShowProfile(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenNotifications={() => setTab("kunngjøringer")}
            notificationCount={activeAlertCount}
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
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                usersHasMore={usersHasMore}
                usersLoadingMore={usersLoadingMore}
                loadMoreUsers={loadMoreUsers}
              />
            )}

            {tab === "team" && (
              <TeamsTab
                teams={searchedTeams}
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
                filteredInstructions={searchedInstructions}
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
                alerts={searchedAlerts}
                toggleAlert={toggleAlert}
                deleteAlert={deleteAlert}
                openEditAlert={openEditAlert}
                setShowCreateAlert={setShowCreateAlert}
                alertsHasMore={alertsHasMore}
                alertsLoadingMore={alertsLoadingMore}
                loadMoreAlerts={loadMoreAlerts}
              />
            )}

            {tab === "ubesvarte" && (
              <AiLogTab unansweredQuestions={searchedUnansweredQuestions} />
            )}

            {tab === "innsikt" && (
              <InsightsTab
                instructions={instructions}
                insightStats={insightStats}
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

            {tab === "gdpr" && <GdprTab onPendingCountChange={setCurrentGdprCount} />}
          </main>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profil</DialogTitle>
            <DialogDescription>
              Oversikt over kontoen din i Tetrivo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Navn</span>
              <span className="font-medium text-foreground">
                {profile.full_name || "Administrator"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">E-post</span>
              <span className="font-medium text-foreground">{profile.email || ""}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rolle</span>
              <span className="font-medium text-foreground">
                {roleLabel(profile.role)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfile(false)}>
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Innstillinger</DialogTitle>
            <DialogDescription>
              Organisasjonsdata og grunninnstillinger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Organisasjon</span>
              <span className="font-medium text-foreground">
                {organization.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Org-ID</span>
              <span className="font-medium text-foreground">
                {organization.id}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <EditAlertModal
        open={showEditAlert}
        editingAlert={editingAlert}
        editAlertTitle={editAlertTitle}
        setEditAlertTitle={setEditAlertTitle}
        editAlertDescription={editAlertDescription}
        setEditAlertDescription={setEditAlertDescription}
        editAlertSeverity={editAlertSeverity}
        setEditAlertSeverity={setEditAlertSeverity}
        editAlertTeams={editAlertTeams}
        setEditAlertTeams={setEditAlertTeams}
        editAlertAllTeams={editAlertAllTeams}
        setEditAlertAllTeams={setEditAlertAllTeams}
        teams={teams}
        alertLoading={alertLoading}
        saveEditAlert={saveEditAlert}
        onClose={() => setShowEditAlert(false)}
      />

      <DisclaimerModal
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
      />
    </>
  );
}
