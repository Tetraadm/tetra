"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cleanupInviteData } from "@/lib/invite-cleanup";
import { cn } from "@/lib/utils";
import AuthWatcher from "@/components/AuthWatcher";
import type {
  Profile,
  Organization,
  Team,
  Alert,
  Instruction,
} from "@/lib/types";
import { useEmployeeChat, useEmployeeInstructions } from "./hooks";
import HomeContent from "./components/HomeContent";
import InstructionsTab from "./components/InstructionsTab";
import AskTetraTab from "./components/AskTetraTab";
import InstructionModal from "./components/InstructionModal";
import AccountTab from "./components/AccountTab";
import { EmployeeHeader } from "@/components/employee/EmployeeHeader";
import {
  EmployeeSidebar,
  type EmployeeTab,
} from "@/components/employee/EmployeeSidebar";
import { EmployeeMobileSidebar } from "@/components/employee/EmployeeMobileSidebar";

type Props = {
  profile: Profile;
  organization: Organization;
  team: Team | null;
  instructions: Instruction[];
  alerts: Alert[];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function EmployeeApp({
  profile,
  organization: _organization,
  instructions,
  alerts,
}: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<
    "hjem" | "instrukser" | "spor" | "account"
  >("hjem");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();

  const {
    searchQuery,
    setSearchQuery,
    selectedInstruction,
    setSelectedInstruction,
    confirmedInstructions,
    confirmingInstruction,
    filteredInstructions,
    criticalInstructions,
    handleConfirmRead,
    selectInstructionById,
  } = useEmployeeInstructions({
    profile,
    instructions,
    supabase,
  });

  const handleOpenSource = useCallback(
    (sourceId: string) => {
      selectInstructionById(sourceId);
      setTab("hjem");
    },
    [selectInstructionById]
  );

  const {
    chatInput,
    setChatInput,
    messages,
    isTyping,
    streamingText,
    chatRef,
    handleAsk,
    handleSuggestion,
    handleOpenSource: handleChatOpenSource,
  } = useEmployeeChat({
    profile,
    onOpenSource: handleOpenSource,
  });

  useEffect(() => {
    cleanupInviteData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleTabChange = (t: EmployeeTab) => {
    setTab(t);
  };

  // Map tab values
  const getContentTab = () => {
    if (tab === "hjem") return "home";
    if (tab === "instrukser") return "instructions";
    if (tab === "spor") return "ask";
    return "account";
  };

  return (
    <>
      <AuthWatcher />
      <div className="min-h-screen bg-background flex">
        <EmployeeSidebar
          activeTab={(tab === "account" ? "hjem" : tab) as EmployeeTab}
          onTabChange={handleTabChange}
        />
        <EmployeeMobileSidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          activeTab={(tab === "account" ? "hjem" : tab) as EmployeeTab}
          onTabChange={handleTabChange}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <EmployeeHeader
            activeTab={(tab === "account" ? "hjem" : tab) as EmployeeTab}
            userName={profile.full_name || "Bruker"}
            userEmail={profile.email || ""}
            onLogout={handleLogout}
            onMenuClick={() => setMobileSidebarOpen(true)}
          />

          <main
            className={cn(
              "flex-1 overflow-y-auto bg-gradient-to-b from-background via-background to-muted/30",
              getContentTab() === "ask" ? "" : "p-4 md:p-6"
            )}
          >
            <div
              className={cn(
                getContentTab() === "ask" ? "h-full" : "max-w-6xl mx-auto"
              )}
            >
              {getContentTab() === "home" && (
                <HomeContent
                  userName={profile.full_name || "Bruker"}
                  alerts={alerts}
                  instructions={instructions}
                  criticalInstructions={criticalInstructions}
                  confirmedCount={confirmedInstructions.size}
                  onTabChange={handleTabChange}
                  onSelectInstruction={setSelectedInstruction}
                />
              )}

              {getContentTab() === "instructions" && (
                <InstructionsTab
                  instructions={instructions}
                  confirmedInstructions={confirmedInstructions}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filteredInstructions={filteredInstructions}
                  onSelectInstruction={setSelectedInstruction}
                />
              )}

              {getContentTab() === "ask" && (
                <AskTetraTab
                  messages={messages}
                  isTyping={isTyping}
                  streamingText={streamingText}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatRef={chatRef}
                  onAsk={handleAsk}
                  onSuggestion={handleSuggestion}
                  onOpenSource={handleChatOpenSource}
                />
              )}

              {getContentTab() === "account" && (
                <AccountTab
                  userName={profile.full_name || "Bruker"}
                  userEmail={profile.email || ""}
                />
              )}
            </div>
          </main>
        </div>

        <InstructionModal
          instruction={selectedInstruction}
          onClose={() => setSelectedInstruction(null)}
          isConfirmed={
            selectedInstruction
              ? confirmedInstructions.has(selectedInstruction.id)
              : false
          }
          isConfirming={
            selectedInstruction
              ? confirmingInstruction === selectedInstruction.id
              : false
          }
          onConfirmRead={handleConfirmRead}
          supabase={supabase}
        />
      </div>
    </>
  );
}
