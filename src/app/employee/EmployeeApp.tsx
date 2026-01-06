'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'

type Profile = {
  id: string
  full_name: string
  role: string
  org_id: string
  team_id: string | null
}

type Organization = {
  id: string
  name: string
}

type Team = {
  id: string
  name: string
}

type Instruction = {
  id: string
  title: string
  content: string | null
  severity: string
  file_url: string | null
}

type Alert = {
  id: string
  title: string
  description: string | null
  severity: string
}

type ChatMessage = {
  type: 'user' | 'bot' | 'notfound'
  text: string
  citation?: string
}

type Props = {
  profile: Profile
  organization: Organization
  team: Team | null
  instructions: Instruction[]
  alerts: Alert[]
}

function FileLink({ fileUrl, supabase }: { fileUrl: string, supabase: ReturnType<typeof createClient> }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isOpening, setIsOpening] = useState(false)

  useEffect(() => {
    const getUrl = async () => {
      const { data } = await supabase.storage
        .from('instructions')
        .createSignedUrl(fileUrl, 3600)
      if (data?.signedUrl) {
        setSignedUrl(data.signedUrl)
      }
    }
    getUrl()
  }, [fileUrl, supabase])

  const handleOpenPdf = async () => {
    if (!signedUrl) return

    setIsOpening(true)

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

    if (isIOS) {
      // iOS Safari: Use window.location for reliable PDF opening
      window.location.href = signedUrl
    } else {
      // Other browsers: Open in new tab
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    }

    // Reset opening state after a delay
    setTimeout(() => setIsOpening(false), 1000)
  }

  if (!signedUrl) return <p style={{ color: '#64748B', fontSize: 14 }}>Laster vedlegg...</p>

  return (
    <button
      onClick={handleOpenPdf}
      disabled={isOpening}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        background: isOpening ? '#DBEAFE' : '#EFF6FF',
        border: '1px solid #BFDBFE',
        borderRadius: 8,
        color: '#2563EB',
        fontWeight: 600,
        fontSize: 14,
        width: '100%',
        cursor: isOpening ? 'wait' : 'pointer',
        boxSizing: 'border-box' as const
      }}
    >
      📄 {isOpening ? 'Åpner...' : 'Åpne vedlegg (PDF)'}
    </button>
  )
}

export default function EmployeeApp({ profile, organization, team, instructions, alerts }: Props) {
  const [tab, setTab] = useState<'home' | 'instructions' | 'ask'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [selectedInstruction, setSelectedInstruction] = useState<Instruction | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [messages])

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login') }

  const severityLabel = (s: string) => s === 'critical' ? 'Kritisk' : s === 'medium' ? 'Middels' : 'Lav'
  const severityColor = (s: string) => s === 'critical' ? { bg: '#FEF2F2', color: '#DC2626' } : s === 'medium' ? { bg: '#FFFBEB', color: '#F59E0B' } : { bg: '#ECFDF5', color: '#10B981' }

  const filteredInstructions = instructions.filter(inst => inst.title.toLowerCase().includes(searchQuery.toLowerCase()) || (inst.content && inst.content.toLowerCase().includes(searchQuery.toLowerCase())))
  const criticalInstructions = instructions.filter(i => i.severity === 'critical')

  const handleAsk = async () => {
    const question = chatInput.trim()
    if (!question) return
    setMessages(prev => [...prev, { type: 'user', text: question }])
    setChatInput('')
    setIsTyping(true)
    try {
      const response = await fetch('/api/ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, orgId: profile.org_id, userId: profile.id }) })
      const data = await response.json()
      if (data.answer) setMessages(prev => [...prev, { type: 'bot', text: data.answer, citation: data.source?.title || undefined }])
      else setMessages(prev => [...prev, { type: 'notfound', text: '' }])
    } catch (error) { setMessages(prev => [...prev, { type: 'notfound', text: 'Kunne ikke koble til Tetra.' }]) }
    setIsTyping(false)
  }

  const handleSuggestion = (q: string) => setChatInput(q)
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const s = {
    container: { minHeight: '100vh', background: '#F8FAFC', maxWidth: 480, margin: '0 auto', position: 'relative' as const, display: 'flex', flexDirection: 'column' as const },
    header: { background: 'white', borderBottom: '1px solid #E2E8F0', padding: '12px 16px', position: 'sticky' as const, top: 0, zIndex: 10 },
    headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    logo: { display: 'flex', alignItems: 'center', gap: 8 },
    logoIcon: { width: 32, height: 32, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 },
    logoText: { fontSize: 18, fontWeight: 800, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
    avatar: { width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
    greeting: { fontSize: 13, color: '#64748B', marginTop: 4 },
    content: { flex: 1, padding: 16, paddingBottom: 80, overflowY: 'auto' as const },
    nav: { position: 'fixed' as const, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-around', padding: '8px 0', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' },
    navItem: (active: boolean) => ({ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4, padding: '8px 16px', background: 'none', border: 'none', color: active ? '#2563EB' : '#94A3B8', cursor: 'pointer', fontSize: 11, fontWeight: 600 }),
    card: { background: 'white', borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 12, overflow: 'hidden' },
    quickActions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
    quickAction: { background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, cursor: 'pointer' },
    quickActionIcon: (color: string) => ({ width: 44, height: 44, borderRadius: 10, background: color === 'blue' ? '#EFF6FF' : '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }),
    sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
    instructionItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #E2E8F0', cursor: 'pointer' },
    instructionIcon: { width: 40, height: 40, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
    instructionContent: { flex: 1 },
    instructionTitle: { fontSize: 14, fontWeight: 600, marginBottom: 4 },
    badge: (bg: string, color: string) => ({ display: 'inline-block', padding: '3px 8px', fontSize: 10, fontWeight: 600, borderRadius: 999, background: bg, color }),
    searchBox: { display: 'flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 14px', marginBottom: 16 },
    searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'none' },
    chatContainer: { display: 'flex', flexDirection: 'column' as const, height: 'calc(100vh - 140px)' },
    chatMessages: { flex: 1, overflowY: 'auto' as const, paddingBottom: 16 },
    chatEmpty: { textAlign: 'center' as const, padding: '40px 20px' },
    chatEmptyIcon: { width: 64, height: 64, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 },
    chatSuggestion: { padding: '12px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13, textAlign: 'left' as const, cursor: 'pointer', marginBottom: 8, width: '100%' },
    message: (isUser: boolean) => ({ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }),
    messageBubble: (isUser: boolean) => ({ maxWidth: '85%', padding: '12px 16px', borderRadius: 12, borderBottomRightRadius: isUser ? 4 : 12, borderBottomLeftRadius: isUser ? 12 : 4, background: isUser ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' : 'white', color: isUser ? 'white' : '#0F172A', border: isUser ? 'none' : '1px solid #E2E8F0', fontSize: 14, lineHeight: 1.5 }),
    notFoundBubble: { maxWidth: '85%', padding: '12px 16px', borderRadius: 12, background: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: 14 },
    citation: { marginTop: 8, paddingTop: 8, borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#2563EB' },
    chatInputContainer: { display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid #E2E8F0', background: '#F8FAFC' },
    chatInput: { flex: 1, padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, outline: 'none', background: 'white' },
    sendBtn: { width: 48, height: 48, border: 'none', borderRadius: 10, background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
    typingIndicator: { display: 'flex', gap: 4, padding: '12px 16px', background: 'white', border: '1px solid #E2E8F0', borderRadius: 12, width: 'fit-content' },
    typingDot: { width: 8, height: 8, borderRadius: '50%', background: '#94A3B8', animation: 'pulse 1s infinite' },
    modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 },
    modalContent: { background: 'white', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const },
    modalHeader: { padding: 16, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
    modalBody: { padding: 16, overflowY: 'auto' as const, flex: 1 },
    modalClose: { width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 },
    alertCard: (severity: string) => ({ background: severityColor(severity).bg, border: `1px solid ${severityColor(severity).color}`, borderRadius: 12, padding: 14, marginBottom: 10 }),
  }

  return (
    <div style={s.container}>
      <header style={s.header}>
        <div style={s.headerTop}>
          <div style={s.logo}>
            <img src="/tetra-logo.png" alt="Tetra" style={{ height: 32, width: 'auto' }} />
          </div>
          <div style={s.avatar} onClick={handleLogout} title="Logg ut">{getInitials(profile.full_name || 'U')}</div>
        </div>
        <div style={s.greeting}>God dag, <strong>{profile.full_name?.split(' ')[0] || 'bruker'}</strong></div>
      </header>
      <div style={s.content}>
        {tab === 'home' && (<>
          {alerts.length > 0 && (<><div style={s.sectionTitle}>⚠️ Aktive varsler</div><div style={{ marginBottom: 20 }}>{alerts.map(alert => (<div key={alert.id} style={s.alertCard(alert.severity)}><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={s.badge(severityColor(alert.severity).bg, severityColor(alert.severity).color)}>{severityLabel(alert.severity)}</span></div><div style={{ fontSize: 14, fontWeight: 600 }}>{alert.title}</div>{alert.description && <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{alert.description}</div>}</div>))}</div></>)}
          <div style={s.quickActions}><div style={s.quickAction} onClick={() => setTab('instructions')}><div style={s.quickActionIcon('blue')}>📋</div><span style={{ fontSize: 13, fontWeight: 600 }}>Instrukser</span></div><div style={s.quickAction} onClick={() => setTab('ask')}><div style={s.quickActionIcon('purple')}>🤖</div><span style={{ fontSize: 13, fontWeight: 600 }}>Spør Tetra</span></div></div>
          {criticalInstructions.length > 0 && (<><div style={s.sectionTitle}>⚡ Kritiske instrukser</div><div style={s.card}><div style={{ padding: '4px 16px' }}>{criticalInstructions.slice(0, 3).map(inst => (<div key={inst.id} style={s.instructionItem} onClick={() => setSelectedInstruction(inst)}><div style={s.instructionIcon}>📋</div><div style={s.instructionContent}><div style={s.instructionTitle}>{inst.title}</div><span style={s.badge('#FEF2F2', '#DC2626')}>Kritisk</span></div></div>))}</div></div></>)}
          <div style={s.sectionTitle}>📑 Siste instrukser</div><div style={s.card}><div style={{ padding: '4px 16px' }}>{instructions.slice(0, 5).map(inst => (<div key={inst.id} style={s.instructionItem} onClick={() => setSelectedInstruction(inst)}><div style={s.instructionIcon}>📋</div><div style={s.instructionContent}><div style={s.instructionTitle}>{inst.title}</div><span style={s.badge(severityColor(inst.severity).bg, severityColor(inst.severity).color)}>{severityLabel(inst.severity)}</span></div></div>))}{instructions.length === 0 && <p style={{ color: '#64748B', padding: '12px 0' }}>Ingen instrukser tilgjengelig</p>}</div></div>
        </>)}
        {tab === 'instructions' && (<><div style={s.searchBox}><span>🔍</span><input style={s.searchInput} placeholder="Søk i instrukser..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} /></div><div style={s.card}><div style={{ padding: '4px 16px' }}>{filteredInstructions.map(inst => (<div key={inst.id} style={s.instructionItem} onClick={() => setSelectedInstruction(inst)}><div style={s.instructionIcon}>📋</div><div style={s.instructionContent}><div style={s.instructionTitle}>{inst.title}</div><span style={s.badge(severityColor(inst.severity).bg, severityColor(inst.severity).color)}>{severityLabel(inst.severity)}</span></div></div>))}{filteredInstructions.length === 0 && <p style={{ color: '#64748B', padding: '12px 0' }}>{searchQuery ? 'Ingen treff' : 'Ingen instrukser tilgjengelig'}</p>}</div></div></>)}
        {tab === 'ask' && (<div style={s.chatContainer}><div style={s.chatMessages} ref={chatRef}>{messages.length === 0 ? (<div style={s.chatEmpty}><div style={s.chatEmptyIcon}>🤖</div><h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Spør Tetra</h3><p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>Still spørsmål om rutiner, sikkerhet eller prosedyrer.</p><button style={s.chatSuggestion} onClick={() => handleSuggestion('Hva gjør jeg ved brann?')}>🔥 Hva gjør jeg ved brann?</button><button style={s.chatSuggestion} onClick={() => handleSuggestion('Hvilket verneutstyr trenger jeg?')}>🦺 Hvilket verneutstyr trenger jeg?</button><button style={s.chatSuggestion} onClick={() => handleSuggestion('Hvordan rapporterer jeg avvik?')}>✍️ Hvordan rapporterer jeg avvik?</button></div>) : (<>{messages.map((msg, idx) => (<div key={idx}>{msg.type === 'user' && <div style={s.message(true)}><div style={s.messageBubble(true)}>{msg.text}</div></div>}{msg.type === 'bot' && <div style={s.message(false)}><div style={s.messageBubble(false)}>{msg.text}{msg.citation && <div style={s.citation}>📄 Kilde: {msg.citation}</div>}</div></div>}{msg.type === 'notfound' && <div style={s.message(false)}><div style={s.notFoundBubble}><strong>Fant ikke relevant instruks.</strong><div style={{ fontSize: 13, marginTop: 4 }}>Kontakt din nærmeste leder hvis dette haster.</div></div></div>}</div>))}{isTyping && <div style={s.message(false)}><div style={s.typingIndicator}><div style={{ ...s.typingDot, animationDelay: '0s' }}></div><div style={{ ...s.typingDot, animationDelay: '0.2s' }}></div><div style={{ ...s.typingDot, animationDelay: '0.4s' }}></div></div></div>}</>)}</div><div style={s.chatInputContainer}><input style={s.chatInput} placeholder="Skriv et spørsmål..." value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAsk()} /><button style={s.sendBtn} onClick={handleAsk}>➤</button></div></div>)}
      </div>
      <nav style={s.nav}><button style={s.navItem(tab === 'home')} onClick={() => setTab('home')}><span style={{ fontSize: 20 }}>🏡</span><span>Hjem</span></button><button style={s.navItem(tab === 'instructions')} onClick={() => setTab('instructions')}><span style={{ fontSize: 20 }}>📋</span><span>Instrukser</span></button><button style={s.navItem(tab === 'ask')} onClick={() => setTab('ask')}><span style={{ fontSize: 20 }}>🤖</span><span>Spør Tetra</span></button></nav>
      {selectedInstruction && (<div style={s.modal} onClick={() => setSelectedInstruction(null)}><div style={s.modalContent} onClick={e => e.stopPropagation()}><div style={s.modalHeader}><div><span style={s.badge(severityColor(selectedInstruction.severity).bg, severityColor(selectedInstruction.severity).color)}>{severityLabel(selectedInstruction.severity)}</span><h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>{selectedInstruction.title}</h2></div><button style={s.modalClose} onClick={() => setSelectedInstruction(null)}>✕</button></div><div style={s.modalBody}>{selectedInstruction.content && <div style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{selectedInstruction.content}</div>}{selectedInstruction.file_url && <FileLink fileUrl={selectedInstruction.file_url} supabase={supabase} />}{!selectedInstruction.content && !selectedInstruction.file_url && <p style={{ color: '#64748B', fontStyle: 'italic' }}>Ingen beskrivelse tilgjengelig.</p>}</div></div></div>)}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
    </div>
  )
}
