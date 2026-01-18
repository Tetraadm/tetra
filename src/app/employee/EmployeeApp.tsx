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
import EmployeeHeader from './components/EmployeeHeader'
import BottomNav from './components/BottomNav'
import HomeContent from './components/HomeContent'
import InstructionsTab from './components/InstructionsTab'
import AskTetraTab from './components/AskTetraTab'
import InstructionModal from './components/InstructionModal'

type Props = {
  profile: Profile
  organization: Organization
  team: Team | null
  instructions: Instruction[]
  alerts: Alert[]
}

export default function EmployeeApp({ profile, organization, team: _team, instructions, alerts }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<'home' | 'instructions' | 'ask'>('home')
  const [isMobile, setIsMobile] = useState(true)
  const router = useRouter()
  void _team

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
    setTab('home')
  }, [selectInstructionById])

  const {
    chatInput,
    setChatInput,
    messages,
    isTyping,
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

  return (
    <>
      <AuthWatcher />
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        paddingBottom: isMobile ? '80px' : 0
      }}>
        <EmployeeHeader
          profile={profile}
          organization={organization}
          isMobile={isMobile}
          onLogout={handleLogout}
        />

        <main style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: isMobile ? 'var(--space-5)' : 'var(--space-8) var(--space-5)'
        }}>
          {isMobile ? (
            <>
              {tab === 'home' && (
                <HomeContent
                  alerts={alerts}
                  instructions={instructions}
                  criticalInstructions={criticalInstructions}
                  isMobile={isMobile}
                  onTabChange={setTab}
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
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatRef={chatRef}
                  onAsk={handleAsk}
                  onSuggestion={handleSuggestion}
                  onOpenSource={handleChatOpenSource}
                  isMobile={isMobile}
                />
              )}
            </>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 400px',
              gap: 'var(--space-8)'
            }}>
              <div>
                <HomeContent
                  alerts={alerts}
                  instructions={instructions}
                  criticalInstructions={criticalInstructions}
                  isMobile={isMobile}
                  onTabChange={setTab}
                  onSelectInstruction={setSelectedInstruction}
                  setSearchQuery={setSearchQuery}
                />
                <div style={{ marginTop: 'var(--space-8)' }}>
                  <InstructionsTab
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filteredInstructions={filteredInstructions}
                    onSelectInstruction={setSelectedInstruction}
                  />
                </div>
              </div>
              <div style={{ position: 'sticky', top: 90, alignSelf: 'flex-start' }}>
                <AskTetraTab
                  messages={messages}
                  isTyping={isTyping}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  chatRef={chatRef}
                  onAsk={handleAsk}
                  onSuggestion={handleSuggestion}
                  onOpenSource={handleChatOpenSource}
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}
        </main>

        {isMobile && (
          <BottomNav tab={tab} onTabChange={setTab} />
        )}

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
