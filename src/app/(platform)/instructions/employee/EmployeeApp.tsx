'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cleanupInviteData } from '@/lib/invite-cleanup'
import AuthWatcher from '@/components/AuthWatcher'
import type {
  Profile,
  Organization,
  Team,
  Alert,
  Instruction
} from '@/lib/types'
import { useEmployeeChat, useEmployeeInstructions } from './hooks'
import HomeContent from './components/HomeContent'
import InstructionsTab from './components/InstructionsTab'
import AskTetraTab from './components/AskTetraTab'
import InstructionModal from './components/InstructionModal'
import { AppHeader } from '@/components/layout/AppHeader'
import { AppSidebar, type SidebarTab } from '@/components/layout/AppSidebar'
import { Home, FileText, MessageSquare } from 'lucide-react'

type Props = {
  profile: Profile
  organization: Organization
  team: Team | null
  instructions: Instruction[]
  alerts: Alert[]
}

export default function EmployeeApp({ profile, organization, instructions, alerts }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<'home' | 'instructions' | 'ask'>('home')
  const [isMobile, setIsMobile] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const router = useRouter()

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
    selectInstructionById
  } = useEmployeeInstructions({
    profile,
    instructions,
    supabase
  })

  const handleOpenSource = useCallback((sourceId: string) => {
    selectInstructionById(sourceId)
    setTab('home') // Or 'instructions' ? In old app it set tab to 'home' maybe because modal is global?
    // Actually if we want to show the instruction, we probably just setting selectedInstruction is enough
    // But if we want to show it in list context...
    // The old code did setTab('home'). Let's stick to that or 'instructions' if it makes more sense.
    // Given the modal is global, 'home' is fine.
  }, [selectInstructionById])

  const {
    chatInput,
    setChatInput,
    messages,
    isTyping,
    streamingText,
    chatRef,
    handleAsk,
    handleSuggestion,
    handleOpenSource: handleChatOpenSource
  } = useEmployeeChat({
    profile,
    onOpenSource: handleOpenSource
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    cleanupInviteData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const employeeTabs: SidebarTab[] = [
    { id: 'home', label: 'Hjem', icon: Home },
    { id: 'instructions', label: 'Bibliotek', icon: FileText },
    { id: 'ask', label: 'Spør Tetrivo', icon: MessageSquare },
  ]

  const handleTabChange = (t: string) => {
    setTab(t as 'home' | 'instructions' | 'ask')
    setShowMobileMenu(false)
  }

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
        />
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          <AppSidebar
            tabs={employeeTabs}
            activeTab={tab}
            onTabChange={handleTabChange}
            open={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
          />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-secondary/30">
            {tab === 'home' && (
              <HomeContent
                alerts={alerts}
                instructions={instructions}
                criticalInstructions={criticalInstructions}
                isMobile={isMobile}
                onTabChange={(t) => setTab(t)}
                onSelectInstruction={setSelectedInstruction}
                setSearchQuery={setSearchQuery}
              />
            )}

            {tab === 'instructions' && (
              <InstructionsTab
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filteredInstructions={filteredInstructions}
                onSelectInstruction={setSelectedInstruction}
              />
            )}

            {tab === 'ask' && (
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
          </main>
        </div>

        <InstructionModal
          instruction={selectedInstruction}
          onClose={() => setSelectedInstruction(null)}
          isConfirmed={selectedInstruction ? confirmedInstructions.has(selectedInstruction.id) : false}
          isConfirming={selectedInstruction ? confirmingInstruction === selectedInstruction.id : false}
          onConfirmRead={handleConfirmRead}
          supabase={supabase}
        />
      </div>
    </>
  )
}
