'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { trackInstructionRead } from '@/lib/read-tracking'
import toast from 'react-hot-toast'
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
  LogOut,
  Flame,
  HardHat,
  PenLine,
} from 'lucide-react'
import type {
  Profile,
  Organization,
  Team,
  Alert,
  ChatMessage
} from '@/lib/types'
import { severityLabel, severityColor } from '@/lib/ui-helpers'

type Instruction = {
  id: string
  title: string
  content: string | null
  severity: string
  file_path: string | null
}

type Props = {
  profile: Profile
  organization: Organization
  team: Team | null
  instructions: Instruction[]
  alerts: Alert[]
}

export default function EmployeeApp({ profile, organization, team, instructions, alerts }: Props) {
  const [tab, setTab] = useState<'home' | 'instructions' | 'ask'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null)
  const [confirmedInstructions, setConfirmedInstructions] = useState<Set<string>>(new Set())
  const [confirmingInstruction, setConfirmingInstruction] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(true)
  const chatRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages])

  useEffect(() => {
    cleanupInviteData()
  }, [])

  useEffect(() => {
    const loadConfirmed = async () => {
      try {
        const { data, error } = await supabase
          .from('instruction_reads')
          .select('instruction_id')
          .eq('user_id', profile.id)
          .eq('confirmed', true)

        if (error) throw error

        if (data) {
          setConfirmedInstructions(new Set(data.map(r => r.instruction_id)))
        }
      } catch (error) {
        console.error('Load confirmed instructions error:', error)
      }
    }
    loadConfirmed()
  }, [profile.id, supabase])

  useEffect(() => {
    if (selectedInstruction) {
      trackInstructionRead(supabase, selectedInstruction.id, profile.id, profile.org_id)
    }
  }, [selectedInstruction, supabase, profile.id, profile.org_id])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const handleConfirmRead = async (instructionId: string) => {
    setConfirmingInstruction(instructionId)
    try {
      const response = await fetch('/api/confirm-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructionId })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.success) {
        setConfirmedInstructions(prev => new Set(prev).add(instructionId))
        toast.success('Bekreftet! Du har lest og forstatt instruksen.')
      } else {
        throw new Error('Ugyldig respons fra server')
      }
    } catch (error) {
      console.error('Confirm read error:', error)
      toast.error('Kunne ikke bekrefte lesing. Prov igjen.')
    } finally {
      setConfirmingInstruction(null)
    }
  }

  const filteredInstructions = instructions.filter(inst => inst.title.toLowerCase().includes(searchQuery.toLowerCase()) || (inst.content && inst.content.toLowerCase().includes(searchQuery.toLowerCase())))
  const criticalInstructions = instructions.filter(i => i.severity === 'critical')

  const handleAsk = async () => {
    const question = chatInput.trim()
    if (!question) return
    setMessages(prev => [...prev, { type: 'user', text: question }])
    setChatInput('')
    setIsTyping(true)
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, orgId: profile.org_id, userId: profile.id })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.answer) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: data.answer,
          citation: data.source?.title || undefined,
          sourceId: data.source?.id || undefined
        }])
      } else {
        setMessages(prev => [...prev, { type: 'notfound', text: '' }])
      }
    } catch (error) {
      console.error('Ask error:', error)
      setMessages(prev => [...prev, {
        type: 'notfound',
        text: 'Kunne ikke koble til Tetra. Sjekk nettforbindelsen din og prov igjen.'
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestion = (q: string) => setChatInput(q)
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const handleOpenSource = (sourceId: string) => {
    const instruction = instructions.find(i => i.id === sourceId)
    if (instruction) {
      setSelectedInstruction(instruction)
      setTab('home')
    }
  }

  const s = {
    container: {
      minHeight: '100vh',
      background: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      padding: '12px 20px',
      position: 'sticky' as const,
      top: 0,
      zIndex: 20,
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
      gap: 12,
    },
    orgBadge: {
      fontSize: 13,
      color: '#64748B',
      background: '#F1F5F9',
      padding: '4px 10px',
      borderRadius: 6,
      fontWeight: 500,
    },
    userSection: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    greeting: {
      fontSize: 14,
      color: '#64748B',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: '#2563EB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
      transition: 'background 150ms ease',
    },
    mainWrapper: {
      flex: 1,
      maxWidth: 1200,
      margin: '0 auto',
      width: '100%',
      padding: isMobile ? '16px' : '24px 32px',
      paddingBottom: isMobile ? 100 : 32,
    },
    twoColumnLayout: {
      display: isMobile ? 'block' : 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: 24,
      alignItems: 'start',
    },
    mainColumn: {
      minWidth: 0,
    },
    sideColumn: {
      position: isMobile ? ('relative' as const) : ('sticky' as const),
      top: isMobile ? 'auto' : 80,
    },
    nav: {
      position: 'fixed' as const,
      bottom: 0,
      left: 0,
      right: 0,
      background: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      display: isMobile ? 'flex' : 'none',
      justifyContent: 'space-around',
      padding: '8px 0',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      zIndex: 20,
    },
    navItem: (active: boolean) => ({
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 4,
      padding: '8px 20px',
      background: 'none',
      border: 'none',
      color: active ? '#2563EB' : '#94A3B8',
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 600,
      transition: 'color 150ms ease',
    }),
    card: {
      background: '#FFFFFF',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      marginBottom: 16,
      overflow: 'hidden',
    },
    quickActions: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
      gap: 12,
      marginBottom: 24,
    },
    quickAction: {
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 10,
      cursor: 'pointer',
      transition: 'all 150ms ease',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    quickActionIcon: (variant: 'blue' | 'purple' | 'amber') => ({
      width: 48,
      height: 48,
      borderRadius: 12,
      background: variant === 'blue' ? '#EFF6FF' : variant === 'purple' ? '#F5F3FF' : '#FFFBEB',
      color: variant === 'blue' ? '#2563EB' : variant === 'purple' ? '#7C3AED' : '#F59E0B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    sectionTitle: {
      fontSize: 15,
      fontWeight: 600,
      marginBottom: 12,
      color: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    instructionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '14px 16px',
      borderBottom: '1px solid #F1F5F9',
      cursor: 'pointer',
      transition: 'background 150ms ease',
    },
    instructionIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: '#F1F5F9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#64748B',
      flexShrink: 0,
    },
    instructionContent: {
      flex: 1,
      minWidth: 0,
    },
    instructionTitle: {
      fontSize: 14,
      fontWeight: 500,
      marginBottom: 4,
      color: '#0F172A',
    },
    badge: (bg: string, color: string) => ({
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 6,
      background: bg,
      color,
    }),
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      padding: '12px 16px',
      marginBottom: 16,
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    searchInput: {
      flex: 1,
      border: 'none',
      outline: 'none',
      fontSize: 14,
      background: 'none',
      color: '#0F172A',
    },
    alertCallout: (severity: string) => ({
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: 16,
      borderRadius: 10,
      background: severityColor(severity).bg,
      borderLeft: `4px solid ${severityColor(severity).color}`,
      marginBottom: 12,
    }),
    chatCard: {
      background: '#FFFFFF',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      height: isMobile ? 'calc(100vh - 200px)' : 500,
    },
    chatHeader: {
      padding: '14px 16px',
      borderBottom: '1px solid #E2E8F0',
      background: '#FAFAFA',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    chatMessages: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: 16,
    },
    chatEmpty: {
      textAlign: 'center' as const,
      padding: '32px 20px',
    },
    chatEmptyIcon: {
      width: 56,
      height: 56,
      background: '#EFF6FF',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      color: '#2563EB',
    },
    chatSuggestion: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      fontSize: 13,
      textAlign: 'left' as const,
      cursor: 'pointer',
      marginBottom: 8,
      width: '100%',
      color: '#334155',
      transition: 'all 150ms ease',
    },
    message: (isUser: boolean) => ({
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
    }),
    messageBubble: (isUser: boolean) => ({
      maxWidth: '85%',
      padding: '12px 16px',
      borderRadius: 12,
      borderBottomRightRadius: isUser ? 4 : 12,
      borderBottomLeftRadius: isUser ? 12 : 4,
      background: isUser ? '#2563EB' : '#FFFFFF',
      color: isUser ? '#FFFFFF' : '#0F172A',
      border: isUser ? 'none' : '1px solid #E2E8F0',
      fontSize: 14,
      lineHeight: 1.6,
      boxShadow: isUser ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    }),
    notFoundBubble: {
      maxWidth: '85%',
      padding: '12px 16px',
      borderRadius: 12,
      background: '#FFFBEB',
      borderLeft: '4px solid #F59E0B',
      color: '#92400E',
      fontSize: 14,
    },
    citation: {
      marginTop: 10,
      paddingTop: 10,
      borderTop: '1px solid #E2E8F0',
      fontSize: 13,
      color: '#2563EB',
      fontWeight: 500,
    },
    chatInputContainer: {
      display: 'flex',
      gap: 8,
      padding: 12,
      borderTop: '1px solid #E2E8F0',
      background: '#FAFAFA',
    },
    chatInput: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      fontSize: 14,
      outline: 'none',
      background: '#FFFFFF',
      transition: 'border-color 150ms ease, box-shadow 150ms ease',
    },
    sendBtn: {
      width: 48,
      height: 48,
      border: 'none',
      borderRadius: 10,
      background: '#2563EB',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 150ms ease',
    },
    typingIndicator: {
      display: 'flex',
      gap: 4,
      padding: '12px 16px',
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      width: 'fit-content',
    },
    typingDot: {
      width: 8,
      height: 8,
      borderRadius: '50%',
      background: '#94A3B8',
      animation: 'pulse 1s infinite',
    },
    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: isMobile ? 0 : 24,
    },
    modalContent: {
      background: '#FFFFFF',
      borderRadius: isMobile ? '16px 16px 0 0' : 16,
      width: '100%',
      maxWidth: 560,
      maxHeight: isMobile ? '90vh' : '80vh',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    },
    modalHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    modalBody: {
      padding: 20,
      overflowY: 'auto' as const,
      flex: 1,
    },
    modalClose: {
      width: 36,
      height: 36,
      borderRadius: 8,
      border: '1px solid #E2E8F0',
      background: '#FFFFFF',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      color: '#64748B',
      transition: 'all 150ms ease',
    },
  }

  const renderHomeContent = () => (
    <>
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={s.sectionTitle}>
            <AlertTriangle size={18} style={{ color: '#F59E0B' }} />
            Aktive varsler
          </div>
          {alerts.map(alert => (
            <div key={alert.id} style={s.alertCallout(alert.severity)}>
              <AlertTriangle size={18} style={{ color: severityColor(alert.severity).color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <span style={s.badge(severityColor(alert.severity).bg, severityColor(alert.severity).color)}>
                  {severityLabel(alert.severity)}
                </span>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>{alert.title}</div>
                {alert.description && <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{alert.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={s.quickActions}>
        <div
          style={s.quickAction}
          onClick={() => setTab('instructions')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#FAFAFA' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF' }}
        >
          <div style={s.quickActionIcon('blue')}>
            <FileText size={24} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Instrukser</span>
        </div>
        <div
          style={s.quickAction}
          onClick={() => setTab('ask')}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.background = '#FAFAFA' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF' }}
        >
          <div style={s.quickActionIcon('purple')}>
            <MessageCircle size={24} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Spor Tetra</span>
        </div>
        {!isMobile && criticalInstructions.length > 0 && (
          <div
            style={s.quickAction}
            onClick={() => { setTab('instructions'); setSearchQuery('') }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#F59E0B'; e.currentTarget.style.background = '#FAFAFA' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF' }}
          >
            <div style={s.quickActionIcon('amber')}>
              <Zap size={24} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{criticalInstructions.length} Kritiske</span>
          </div>
        )}
      </div>

      {criticalInstructions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={s.sectionTitle}>
            <Zap size={18} style={{ color: '#F59E0B' }} />
            Kritiske instrukser
          </div>
          <div style={s.card}>
            {criticalInstructions.slice(0, 3).map(inst => (
              <div
                key={inst.id}
                style={s.instructionItem}
                onClick={() => setSelectedInstruction(inst)}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={s.instructionIcon}>
                  <FileText size={18} />
                </div>
                <div style={s.instructionContent}>
                  <div style={s.instructionTitle}>{inst.title}</div>
                  <span style={s.badge('#FEF2F2', '#DC2626')}>Kritisk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={s.sectionTitle}>
          <Clock size={18} style={{ color: '#64748B' }} />
          Siste instrukser
        </div>
        <div style={s.card}>
          {instructions.slice(0, 5).map(inst => (
            <div
              key={inst.id}
              style={s.instructionItem}
              onClick={() => setSelectedInstruction(inst)}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={s.instructionIcon}>
                <FileText size={18} />
              </div>
              <div style={s.instructionContent}>
                <div style={s.instructionTitle}>{inst.title}</div>
                <span style={s.badge(severityColor(inst.severity).bg, severityColor(inst.severity).color)}>
                  {severityLabel(inst.severity)}
                </span>
              </div>
            </div>
          ))}
          {instructions.length === 0 && (
            <p style={{ color: '#64748B', padding: 16, textAlign: 'center' }}>Ingen instrukser tilgjengelig</p>
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
          input.style.borderColor = '#2563EB'
          input.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
        }}
        onBlur={(e) => {
          const input = e.currentTarget
          input.style.borderColor = '#E2E8F0'
          input.style.boxShadow = 'none'
        }}
      >
        <Search size={18} style={{ color: '#94A3B8' }} />
        <input
          style={s.searchInput}
          placeholder="Søk i instrukser..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div style={s.card}>
        {filteredInstructions.map(inst => (
          <div
            key={inst.id}
            style={s.instructionItem}
            onClick={() => setSelectedInstruction(inst)}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <div style={s.instructionIcon}>
              <FileText size={18} />
            </div>
            <div style={s.instructionContent}>
              <div style={s.instructionTitle}>{inst.title}</div>
              <span style={s.badge(severityColor(inst.severity).bg, severityColor(inst.severity).color)}>
                {severityLabel(inst.severity)}
              </span>
            </div>
          </div>
        ))}
        {filteredInstructions.length === 0 && (
          <p style={{ color: '#64748B', padding: 16, textAlign: 'center' }}>
            {searchQuery ? 'Ingen treff' : 'Ingen instrukser tilgjengelig'}
          </p>
        )}
      </div>
    </>
  )

  const renderChatContent = () => (
    <div style={s.chatCard}>
      <div style={s.chatHeader}>
        <MessageCircle size={20} style={{ color: '#2563EB' }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>Spor Tetra</span>
      </div>
      <div style={s.chatMessages} ref={chatRef}>
        {messages.length === 0 ? (
          <div style={s.chatEmpty}>
            <div style={s.chatEmptyIcon}>
              <MessageCircle size={28} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#0F172A' }}>
              Still et sporsmal
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
              Spor om rutiner, sikkerhet eller prosedyrer.
            </p>
            <button
              style={s.chatSuggestion}
              onClick={() => handleSuggestion('Hva gjor jeg ved brann?')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF' }}
            >
              <Flame size={16} style={{ color: '#F97316' }} />
              Hva gjor jeg ved brann?
            </button>
            <button
              style={s.chatSuggestion}
              onClick={() => handleSuggestion('Hvilket verneutstyr trenger jeg?')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF' }}
            >
              <HardHat size={16} style={{ color: '#2563EB' }} />
              Hvilket verneutstyr trenger jeg?
            </button>
            <button
              style={s.chatSuggestion}
              onClick={() => handleSuggestion('Hvordan rapporterer jeg avvik?')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF' }}
            >
              <PenLine size={16} style={{ color: '#10B981' }} />
              Hvordan rapporterer jeg avvik?
            </button>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
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
                      {msg.citation && (
                        <div
                          style={{ ...s.citation, cursor: msg.sourceId ? 'pointer' : 'default' }}
                          onClick={() => msg.sourceId && handleOpenSource(msg.sourceId)}
                        >
                          <FileText size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                          {msg.sourceId ? 'Klikk for \u00e5 \u00e5pne: ' : 'Kilde: '}{msg.citation}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {msg.type === 'notfound' && (
                  <div style={s.message(false)}>
                    <div style={s.notFoundBubble}>
                      <strong>Fant ikke relevant instruks.</strong>
                      <div style={{ fontSize: 13, marginTop: 4 }}>
                        Kontakt din nermeste leder hvis dette haster.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
            e.currentTarget.style.borderColor = '#2563EB'
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E2E8F0'
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button
          style={s.sendBtn}
          onClick={handleAsk}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1D4ED8' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB' }}
          aria-label="Send melding"
        >
          <Send size={20} />
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
              <img src="/tetra-logo.png" alt="Tetra" style={{ height: 32, width: 'auto' }} />
              {!isMobile && <span style={s.orgBadge}>{organization.name}</span>}
            </div>
            <div style={s.userSection}>
              {!isMobile && <span style={s.greeting}>Hei, {profile.full_name?.split(' ')[0] || 'bruker'}</span>}
              <div
                style={s.avatar}
                onClick={handleLogout}
                title="Logg ut"
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1D4ED8' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#2563EB' }}
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
                <div style={{ marginTop: 24 }}>
                  <div style={s.sectionTitle}>
                    <FileText size={18} style={{ color: '#64748B' }} />
                    Alle instrukser
                  </div>
                  {renderInstructionsContent()}
                </div>
              </div>
              <div style={s.sideColumn}>
                <div style={s.sectionTitle}>
                  <MessageCircle size={18} style={{ color: '#2563EB' }} />
                  Spor Tetra
                </div>
                {renderChatContent()}
              </div>
            </div>
          )}
        </div>

        <nav style={s.nav}>
          <button style={s.navItem(tab === 'home')} onClick={() => setTab('home')}>
            <Home size={22} />
            <span>Hjem</span>
          </button>
          <button style={s.navItem(tab === 'instructions')} onClick={() => setTab('instructions')}>
            <FileText size={22} />
            <span>Instrukser</span>
          </button>
          <button style={s.navItem(tab === 'ask')} onClick={() => setTab('ask')}>
            <MessageCircle size={22} />
            <span>Spor Tetra</span>
          </button>
        </nav>

        {selectedInstruction && (
          <div style={s.modal} onClick={() => setSelectedInstruction(null)}>
            <div style={s.modalContent} onClick={e => e.stopPropagation()}>
              <div style={s.modalHeader}>
                <div>
                  <span style={s.badge(severityColor(selectedInstruction.severity).bg, severityColor(selectedInstruction.severity).color)}>
                    {severityLabel(selectedInstruction.severity)}
                  </span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 8, color: '#0F172A' }}>
                    {selectedInstruction.title}
                  </h2>
                </div>
                <button
                  style={s.modalClose}
                  onClick={() => setSelectedInstruction(null)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF' }}
                  aria-label="Lukk"
                >
                  <X size={18} />
                </button>
              </div>
              <div style={s.modalBody}>
                {selectedInstruction.content && (
                  <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16, color: '#334155' }}>
                    {selectedInstruction.content}
                  </div>
                )}
                {selectedInstruction.file_path && <FileLink fileUrl={selectedInstruction.file_path} supabase={supabase} />}
                {!selectedInstruction.content && !selectedInstruction.file_path && (
                  <p style={{ color: '#64748B', fontStyle: 'italic' }}>Ingen beskrivelse tilgjengelig.</p>
                )}
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                  {confirmedInstructions.has(selectedInstruction.id) ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: 10,
                      color: '#065F46',
                      fontSize: 14,
                      fontWeight: 600,
                    }}>
                      <CheckCircle size={18} />
                      Du har bekreftet at du har lest og forstatt denne instruksen
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConfirmRead(selectedInstruction.id)}
                      disabled={confirmingInstruction === selectedInstruction.id}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        background: confirmingInstruction === selectedInstruction.id ? '#9CA3AF' : '#2563EB',
                        border: 'none',
                        borderRadius: 10,
                        color: 'white',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: confirmingInstruction === selectedInstruction.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'background 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        if (confirmingInstruction !== selectedInstruction.id) {
                          e.currentTarget.style.background = '#1D4ED8'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (confirmingInstruction !== selectedInstruction.id) {
                          e.currentTarget.style.background = '#2563EB'
                        }
                      }}
                    >
                      {confirmingInstruction === selectedInstruction.id ? (
                        <>
                          <div style={{ width: 18, height: 18, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                          Bekrefter...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={18} />
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
        `}</style>
      </div>
    </>
  )
}
