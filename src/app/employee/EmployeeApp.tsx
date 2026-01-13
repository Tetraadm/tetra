'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { cleanupInviteData } from '@/lib/invite-cleanup'
import AuthWatcher from '@/components/AuthWatcher'
import FileLink from '@/components/FileLink'
import {
  Home,
  FileText,
  MessageCircle,
  AlertTriangle,
  Search,
  Send,
  X,
  Zap,
  Clock,
  CheckCircle,
  Flame,
  HardHat,
  PenLine,
} from 'lucide-react'
import type {
  Profile,
  Organization,
  Team,
  Alert,
  Instruction
} from '@/lib/types'
import { severityLabel, severityColor, colors, shadows, radius, transitions } from '@/lib/ui-helpers'
import { useEmployeeChat, useEmployeeInstructions } from './hooks'

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

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const s = {
    container: {
      minHeight: '100vh',
      background: colors.background,
      display: 'flex',
      flexDirection: 'column' as const,
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    },
    header: {
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
      padding: '14px 20px',
      position: 'sticky' as const,
      top: 0,
      zIndex: 20,
      boxShadow: shadows.xs,
    },
    headerInner: {
      maxWidth: 1200,
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    },
    orgBadge: {
      fontSize: 13,
      color: colors.textSecondary,
      background: colors.primarySubtle,
      padding: '5px 12px',
      borderRadius: radius.full,
      fontWeight: 600,
      border: `1px solid ${colors.primaryMuted}`,
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    },
    greeting: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: 500,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
      boxShadow: `0 2px 8px -2px ${colors.primary}60`,
    },
    mainWrapper: {
      flex: 1,
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
      padding: isMobile ? '20px' : '28px 36px',
      paddingBottom: isMobile ? 100 : 36,
    },
    twoColumnLayout: {
      display: isMobile ? 'block' : 'grid',
      gridTemplateColumns: '1fr 420px',
      gap: 28,
      alignItems: 'start',
    },
    mainColumn: {
      minWidth: 0,
    },
    sideColumn: {
      position: isMobile ? ('relative' as const) : ('sticky' as const),
      top: isMobile ? 'auto' : 90,
    },
    nav: {
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      background: colors.surface,
      borderTop: `1px solid ${colors.border}`,
      display: isMobile ? 'flex' : 'none',
      justifyContent: 'space-around',
      padding: '10px 0',
      paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
      zIndex: 20,
      boxShadow: '0 -4px 12px -4px rgba(0, 0, 0, 0.08)',
    },
    navItem: (active: boolean) => ({
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 5,
      padding: '8px 24px',
      background: 'none',
      border: 'none',
      color: active ? colors.primary : colors.textMuted,
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 600,
      transition: `color ${transitions.fast}`,
      letterSpacing: '0.01em',
    }),
    card: {
      background: colors.surface,
      borderRadius: radius.lg,
      border: `1px solid ${colors.border}`,
      boxShadow: shadows.sm,
      marginBottom: 18,
      overflow: 'hidden',
      transition: `all ${transitions.normal}`,
    },
    quickActions: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
      gap: 14,
      marginBottom: 28,
    },
    quickAction: {
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
      padding: 18,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 12,
      cursor: 'pointer',
      transition: `all ${transitions.normal}`,
      boxShadow: shadows.sm,
    },
    quickActionIcon: (variant: 'primary' | 'purple' | 'amber') => ({
      width: 52,
      height: 52,
      borderRadius: radius.md,
      background: variant === 'primary' ? colors.primarySubtle : variant === 'purple' ? '#F5F3FF' : colors.warningLight,
      color: variant === 'primary' ? colors.primary : variant === 'purple' ? '#7C3AED' : colors.warning,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    sectionTitle: {
      fontSize: 15,
      fontWeight: 600,
      marginBottom: 14,
      color: colors.text,
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      letterSpacing: '-0.01em',
    },
    instructionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '16px 18px',
      borderBottom: `1px solid ${colors.borderSubtle}`,
      cursor: 'pointer',
      transition: `background ${transitions.fast}`,
    },
    instructionIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      background: colors.backgroundSubtle,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.textMuted,
      flexShrink: 0,
    },
    instructionContent: {
      flex: 1,
      minWidth: 0,
    },
    instructionTitle: {
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 6,
      color: colors.text,
    },
    badge: (bg: string, color: string, border?: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 600,
      borderRadius: radius.full,
      background: bg,
      color,
      border: border ? `1px solid ${border}` : 'none',
      letterSpacing: '0.02em',
      textTransform: 'uppercase' as const,
    }),
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      padding: '14px 18px',
      marginBottom: 18,
      transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
    },
    searchInput: {
      flex: 1,
      border: 'none',
      outline: 'none',
      fontSize: 14,
      background: 'none',
      color: colors.text,
      fontFamily: 'inherit',
    },
    alertCallout: (severity: string) => {
      const sev = severityColor(severity)
      return {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        padding: 18,
        borderRadius: radius.md,
        background: sev.bg,
        borderLeft: `4px solid ${sev.color}`,
        marginBottom: 14,
      }
    },
    chatCard: {
      background: colors.surface,
      borderRadius: radius.lg,
      border: `1px solid ${colors.border}`,
      boxShadow: shadows.md,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      height: isMobile ? 'calc(100vh - 200px)' : 520,
    },
    chatHeader: {
      padding: '16px 18px',
      borderBottom: `1px solid ${colors.border}`,
      background: colors.backgroundSubtle,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    chatMessages: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: 18,
    },
    chatEmpty: {
      textAlign: 'center' as const,
      padding: '36px 24px',
    },
    chatEmptyIcon: {
      width: 64,
      height: 64,
      background: colors.primarySubtle,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      color: colors.primary,
    },
    chatSuggestion: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      fontSize: 13,
      textAlign: 'left' as const,
      cursor: 'pointer',
      marginBottom: 10,
      width: '100%',
      color: colors.text,
      fontWeight: 500,
      transition: `all ${transitions.normal}`,
      fontFamily: 'inherit',
    },
    message: (isUser: boolean) => ({
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 14,
    }),
    messageBubble: (isUser: boolean) => ({
      maxWidth: '85%',
      padding: '14px 18px',
      borderRadius: radius.lg,
      borderBottomRightRadius: isUser ? '4px' : radius.lg,
      borderBottomLeftRadius: isUser ? radius.lg : '4px',
      background: isUser ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)` : colors.surface,
      color: isUser ? '#FFFFFF' : colors.text,
      border: isUser ? 'none' : `1px solid ${colors.border}`,
      fontSize: 14,
      lineHeight: 1.65,
      boxShadow: isUser ? `0 4px 12px -4px ${colors.primary}50` : shadows.xs,
    }),
    notFoundBubble: {
      maxWidth: '85%',
      padding: '14px 18px',
      borderRadius: radius.lg,
      background: colors.warningLight,
      borderLeft: `4px solid ${colors.warning}`,
      color: '#92400E',
      fontSize: 14,
    },
    citation: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: '1px solid rgba(255,255,255,0.2)',
      fontSize: 13,
      color: '#E0F2FE',
      fontWeight: 500,
    },
    chatInputContainer: {
      display: 'flex',
      gap: 10,
      padding: 14,
      borderTop: `1px solid ${colors.border}`,
      background: colors.backgroundSubtle,
    },
    chatInput: {
      flex: 1,
      padding: '14px 18px',
      border: `1px solid ${colors.border}`,
      borderRadius: radius.md,
      fontSize: 14,
      outline: 'none',
      background: colors.surface,
      transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
      fontFamily: 'inherit',
      color: colors.text,
    },
    sendBtn: {
      width: 52,
      height: 52,
      border: 'none',
      borderRadius: radius.md,
      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: `all ${transitions.normal}`,
      boxShadow: `0 4px 12px -4px ${colors.primary}50`,
    },
    typingIndicator: {
      display: 'flex',
      gap: 5,
      padding: '14px 18px',
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: radius.lg,
      width: 'fit-content',
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: colors.primary,
      animation: 'pulse 1s infinite',
    },
    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: isMobile ? 0 : 28,
    },
    modalContent: {
      background: colors.surface,
      borderRadius: isMobile ? '20px 20px 0 0' : radius.xl,
      width: '100%',
      maxWidth: 580,
      maxHeight: isMobile ? '90vh' : '85vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: shadows.xl,
    },
    modalHeader: {
      padding: '20px 24px',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16,
      background: colors.backgroundSubtle,
    },
    modalBody: {
      padding: 24,
      overflowY: 'auto' as const,
      flex: 1,
    },
    modalClose: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      border: `1px solid ${colors.border}`,
      background: colors.surface,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: colors.textMuted,
      transition: `all ${transitions.fast}`,
    },
  }

  const renderHomeContent = () => (
    <>
      {alerts.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={s.sectionTitle}>
            <AlertTriangle size={18} style={{ color: colors.warning }} />
            Aktive varsler
          </div>
          {alerts.map(alert => (
            <div key={alert.id} style={s.alertCallout(alert.severity)}>
              <AlertTriangle size={20} style={{ color: severityColor(alert.severity).color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <span style={s.badge(severityColor(alert.severity).bg, severityColor(alert.severity).color, severityColor(alert.severity).border)}>
                  {severityLabel(alert.severity)}
                </span>
                <div style={{ fontSize: 15, fontWeight: 600, marginTop: 8, color: colors.text }}>{alert.title}</div>
                {alert.description && <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 1.5 }}>{alert.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={s.quickActions}>
        <div
          style={s.quickAction}
          onClick={() => setTab('instructions')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.boxShadow = shadows.md }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = shadows.sm }}
        >
          <div style={s.quickActionIcon('primary')}>
            <FileText size={26} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>Instrukser</span>
        </div>
        <div
          style={s.quickAction}
          onClick={() => setTab('ask')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = shadows.md }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = shadows.sm }}
        >
          <div style={s.quickActionIcon('purple')}>
            <MessageCircle size={26} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>Spor Tetra</span>
        </div>
        {!isMobile && criticalInstructions.length > 0 && (
          <div
            style={s.quickAction}
            onClick={() => { setTab('instructions'); setSearchQuery('') }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.warning; e.currentTarget.style.boxShadow = shadows.md }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = shadows.sm }}
          >
            <div style={s.quickActionIcon('amber')}>
              <Zap size={26} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{criticalInstructions.length} Kritiske</span>
          </div>
        )}
      </div>

      {criticalInstructions.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={s.sectionTitle}>
            <Zap size={18} style={{ color: colors.danger }} />
            Kritiske instrukser
          </div>
          <div style={s.card}>
            {criticalInstructions.slice(0, 3).map(inst => (
              <div
                key={inst.id}
                style={s.instructionItem}
                onClick={() => setSelectedInstruction(inst)}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundSubtle }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ ...s.instructionIcon, background: colors.dangerLight, color: colors.danger }}>
                  <FileText size={20} />
                </div>
                <div style={s.instructionContent}>
                  <div style={s.instructionTitle}>{inst.title}</div>
                  <span style={s.badge(colors.dangerLight, colors.danger, colors.dangerBorder)}>Kritisk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={s.sectionTitle}>
          <Clock size={18} style={{ color: colors.textMuted }} />
          Siste instrukser
        </div>
        <div style={s.card}>
          {instructions.slice(0, 5).map(inst => {
            const sev = severityColor(inst.severity)
            return (
              <div
                key={inst.id}
                style={s.instructionItem}
                onClick={() => setSelectedInstruction(inst)}
                onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundSubtle }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={s.instructionIcon}>
                  <FileText size={20} />
                </div>
                <div style={s.instructionContent}>
                  <div style={s.instructionTitle}>{inst.title}</div>
                  <span style={s.badge(sev.bg, sev.color, sev.border)}>
                    {severityLabel(inst.severity)}
                  </span>
                </div>
              </div>
            )
          })}
          {instructions.length === 0 && (
            <p style={{ color: colors.textMuted, padding: 20, textAlign: 'center' }}>Ingen instrukser tilgjengelig</p>
          )}
        </div>
      </div>
    </>
  )

  const renderInstructionsContent = () => (
    <>
      <div
        style={s.searchBox}
        onFocus={(e) => {
          const input = e.currentTarget
          input.style.borderColor = colors.primary
          input.style.boxShadow = shadows.focus
        }}
        onBlur={(e) => {
          const input = e.currentTarget
          input.style.borderColor = colors.border
          input.style.boxShadow = 'none'
        }}
      >
        <Search size={20} style={{ color: colors.textMuted }} />
        <input
          style={s.searchInput}
          placeholder="Sok i instrukser..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div style={s.card}>
        {filteredInstructions.map(inst => {
          const sev = severityColor(inst.severity)
          return (
            <div
              key={inst.id}
              style={s.instructionItem}
              onClick={() => setSelectedInstruction(inst)}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundSubtle }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={s.instructionIcon}>
                <FileText size={20} />
              </div>
              <div style={s.instructionContent}>
                <div style={s.instructionTitle}>{inst.title}</div>
                <span style={s.badge(sev.bg, sev.color, sev.border)}>
                  {severityLabel(inst.severity)}
                </span>
              </div>
            </div>
          )
        })}
        {filteredInstructions.length === 0 && (
          <p style={{ color: colors.textMuted, padding: 20, textAlign: 'center' }}>
            {searchQuery ? 'Ingen treff' : 'Ingen instrukser tilgjengelig'}
          </p>
        )}
      </div>
    </>
  )

  const renderChatContent = () => (
    <div style={s.chatCard}>
      <div style={s.chatHeader}>
        <MessageCircle size={22} style={{ color: colors.primary }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>Spor Tetra</span>
      </div>
      <div style={s.chatMessages} ref={chatRef}>
        {messages.length === 0 ? (
          <div style={s.chatEmpty}>
            <div style={s.chatEmptyIcon}>
              <MessageCircle size={32} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: colors.text }}>
              Still et sporsmal
            </h3>
            <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 1.5 }}>
              Spor om rutiner, sikkerhet eller prosedyrer.
            </p>
            <button
              style={s.chatSuggestion}
              onClick={() => handleSuggestion('Hva gjor jeg ved brann?')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.background = colors.backgroundSubtle }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.surface }}
            >
              <Flame size={18} style={{ color: colors.high }} />
              Hva gjor jeg ved brann?
            </button>
            <button
              style={s.chatSuggestion}
              onClick={() => handleSuggestion('Hvilket verneutstyr trenger jeg?')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.background = colors.backgroundSubtle }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.surface }}
            >
              <HardHat size={18} style={{ color: colors.primary }} />
              Hvilket verneutstyr trenger jeg?
            </button>
            <button
              style={s.chatSuggestion}
              onClick={() => handleSuggestion('Hvordan rapporterer jeg avvik?')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.borderStrong; e.currentTarget.style.background = colors.backgroundSubtle }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.background = colors.surface }}
            >
              <PenLine size={18} style={{ color: colors.success }} />
              Hvordan rapporterer jeg avvik?
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const notFoundMessage = msg.type === 'notfound' ? msg.text.trim() : ''
              return (
              <div key={idx}>
                {msg.type === 'user' && (
                  <div style={s.message(true)}>
                    <div style={s.messageBubble(true)}>{msg.text}</div>
                  </div>
                )}
                {msg.type === 'bot' && (
                  <div style={s.message(false)}>
                    <div style={s.messageBubble(false)}>
                      {msg.text}
                      {msg.source && (
                        <div
                            style={{ ...s.citation, borderTopColor: colors.border, color: colors.primary }}
                          >
                            <div style={{ marginBottom: 6 }}>
                              Kilde: {msg.source.title} (oppdatert {msg.source.updated_at ? new Date(msg.source.updated_at).toISOString().split('T')[0] : 'ukjent'})
                            </div>
                            <div
                              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                              onClick={() => handleChatOpenSource(msg.source!.instruction_id)}
                            >
                              <FileText size={14} />
                              Klikk for a apne: {msg.source.title}
                            </div>
                          </div>
                      )}
                    </div>
                  </div>
                )}
                {msg.type === 'notfound' && (
                  <div style={s.message(false)}>
                    <div style={s.notFoundBubble}>
                      <strong>{notFoundMessage || 'Fant ikke relevant instruks.'}</strong>
                      {!notFoundMessage && (
                        <div style={{ fontSize: 13, marginTop: 6 }}>
                          Kontakt din naermeste leder hvis dette haster.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )})}
            {isTyping && (
              <div style={s.message(false)}>
                <div style={s.typingIndicator}>
                  <div style={{ ...s.typingDot, animationDelay: '0s' }}></div>
                  <div style={{ ...s.typingDot, animationDelay: '0.2s' }}></div>
                  <div style={{ ...s.typingDot, animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div style={s.chatInputContainer}>
        <input
          style={s.chatInput}
          placeholder="Skriv et sporsmal..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAsk()}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = colors.primary
            e.currentTarget.style.boxShadow = shadows.focus
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = colors.border
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button
          style={s.sendBtn}
          onClick={handleAsk}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 16px -4px ${colors.primary}60` }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 12px -4px ${colors.primary}50` }}
          aria-label="Send melding"
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <AuthWatcher />
      <div style={s.container}>
        <header style={s.header}>
          <div style={s.headerInner}>
            <div style={s.logo}>
              <Image
                src="/tetra-logo.png"
                alt="Tetra"
                width={120}
                height={36}
                style={{ height: 36, width: 'auto' }}
              />
              {!isMobile && <span style={s.orgBadge}>{organization.name}</span>}
            </div>
            <div style={s.userSection}>
              {!isMobile && <span style={s.greeting}>Hei, {profile.full_name?.split(' ')[0] || 'bruker'}</span>}
              <div
                style={s.avatar}
                onClick={handleLogout}
                title="Logg ut"
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                {getInitials(profile.full_name || 'U')}
              </div>
            </div>
          </div>
        </header>

        <div style={s.mainWrapper}>
          {isMobile ? (
            <>
              {tab === 'home' && renderHomeContent()}
              {tab === 'instructions' && renderInstructionsContent()}
              {tab === 'ask' && renderChatContent()}
            </>
          ) : (
            <div style={s.twoColumnLayout}>
              <div style={s.mainColumn}>
                {renderHomeContent()}
                <div style={{ marginTop: 28 }}>
                  <div style={s.sectionTitle}>
                    <FileText size={18} style={{ color: colors.textMuted }} />
                    Alle instrukser
                  </div>
                  {renderInstructionsContent()}
                </div>
              </div>
              <div style={s.sideColumn}>
                <div style={s.sectionTitle}>
                  <MessageCircle size={18} style={{ color: colors.primary }} />
                  Spor Tetra
                </div>
                {renderChatContent()}
              </div>
            </div>
          )}
        </div>

        <nav style={s.nav}>
          <button style={s.navItem(tab === 'home')} onClick={() => setTab('home')}>
            <Home size={24} />
            <span>Hjem</span>
          </button>
          <button style={s.navItem(tab === 'instructions')} onClick={() => setTab('instructions')}>
            <FileText size={24} />
            <span>Instrukser</span>
          </button>
          <button style={s.navItem(tab === 'ask')} onClick={() => setTab('ask')}>
            <MessageCircle size={24} />
            <span>Spor Tetra</span>
          </button>
        </nav>

        {selectedInstruction && (
          <div style={s.modal} onClick={() => setSelectedInstruction(null)}>
            <div style={s.modalContent} onClick={e => e.stopPropagation()}>
              <div style={s.modalHeader}>
                <div>
                  <span style={s.badge(severityColor(selectedInstruction.severity).bg, severityColor(selectedInstruction.severity).color, severityColor(selectedInstruction.severity).border)}>
                    {severityLabel(selectedInstruction.severity)}
                  </span>
                  <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 10, color: colors.text, letterSpacing: '-0.02em' }}>
                    {selectedInstruction.title}
                  </h2>
                </div>
                <button
                  style={s.modalClose}
                  onClick={() => setSelectedInstruction(null)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundSubtle }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface }}
                  aria-label="Lukk"
                >
                  <X size={20} />
                </button>
              </div>
              <div style={s.modalBody}>
                {selectedInstruction.content && (
                  <div style={{ fontSize: 15, lineHeight: 1.75, whiteSpace: 'pre-wrap', marginBottom: 20, color: colors.textSecondary }}>
                    {selectedInstruction.content}
                  </div>
                )}
                {selectedInstruction.file_path && <FileLink fileUrl={selectedInstruction.file_path} supabase={supabase} />}
                {!selectedInstruction.content && !selectedInstruction.file_path && (
                  <p style={{ color: colors.textMuted, fontStyle: 'italic' }}>Ingen beskrivelse tilgjengelig.</p>
                )}
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${colors.border}` }}>
                  {confirmedInstructions.has(selectedInstruction.id) ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '14px 18px',
                      background: colors.successLight,
                      border: `1px solid ${colors.successBorder}`,
                      borderRadius: radius.md,
                      color: colors.success,
                      fontSize: 14,
                      fontWeight: 600,
                    }}>
                      <CheckCircle size={20} />
                      Du har bekreftet at du har lest og forstatt denne instruksen
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConfirmRead(selectedInstruction.id)}
                      disabled={confirmingInstruction === selectedInstruction.id}
                      style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: confirmingInstruction === selectedInstruction.id ? colors.textMuted : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
                        border: 'none',
                        borderRadius: radius.md,
                        color: 'white',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: confirmingInstruction === selectedInstruction.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        transition: `all ${transitions.normal}`,
                        boxShadow: confirmingInstruction === selectedInstruction.id ? 'none' : `0 4px 12px -4px ${colors.primary}50`,
                        fontFamily: 'inherit',
                      }}
                      onMouseEnter={(e) => {
                        if (confirmingInstruction !== selectedInstruction.id) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          e.currentTarget.style.boxShadow = `0 6px 16px -4px ${colors.primary}60`
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (confirmingInstruction !== selectedInstruction.id) {
                          e.currentTarget.style.transform = 'translateY(0)'
                          e.currentTarget.style.boxShadow = `0 4px 12px -4px ${colors.primary}50`
                        }
                      }}
                    >
                      {confirmingInstruction === selectedInstruction.id ? (
                        <>
                          <div style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Bekrefter...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={20} />
                          Jeg har lest og forstatt
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    </>
  )
}
