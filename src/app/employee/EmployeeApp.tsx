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
}

export default function EmployeeApp({ 
  profile, 
  organization, 
  team,
  instructions
}: Props) {
  const [tab, setTab] = useState<'home' | 'instructions' | 'ask'>('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const severityLabel = (s: string) => {
    if (s === 'critical') return 'Kritisk'
    if (s === 'medium') return 'Middels'
    return 'Lav'
  }

  const severityColor = (s: string) => {
    if (s === 'critical') return { bg: '#FEF2F2', color: '#DC2626' }
    if (s === 'medium') return { bg: '#FFFBEB', color: '#F59E0B' }
    return { bg: '#ECFDF5', color: '#10B981' }
  }

  const filteredInstructions = instructions.filter(inst =>
    inst.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (inst.content && inst.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

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
        body: JSON.stringify({
          question,
          orgId: profile.org_id,
          userId: profile.id
        })
      })

      const data = await response.json()

      if (data.answer) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: data.answer,
          citation: data.source?.title || undefined
        }])
      } else {
        setMessages(prev => [...prev, { type: 'notfound', text: '' }])
      }
    } catch (error) {
      console.error('Error asking Tetra:', error)
      setMessages(prev => [...prev, { 
        type: 'notfound', 
        text: 'Kunne ikke koble til Tetra. Prøv igjen.' 
      }])
    }

    setIsTyping(false)
  }

  const handleSuggestion = (question: string) => {
    setChatInput(question)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const styles = {
    container: {
      minHeight: '100vh',
      background: '#F8FAFC',
      maxWidth: 480,
      margin: '0 auto',
      position: 'relative' as const,
      display: 'flex',
      flexDirection: 'column' as const,
    },
    header: {
      background: 'white',
      borderBottom: '1px solid #E2E8F0',
      padding: '12px 16px',
      position: 'sticky' as const,
      top: 0,
      zIndex: 10,
    },
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    logoIcon: {
      width: 32,
      height: 32,
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 800,
      fontSize: 16,
    },
    logoText: {
      fontSize: 18,
      fontWeight: 800,
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 600,
      fontSize: 14,
      cursor: 'pointer',
    },
    greeting: {
      fontSize: 13,
      color: '#64748B',
      marginTop: 4,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingBottom: 80,
      overflowY: 'auto' as const,
    },
    nav: {
      position: 'fixed' as const,
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 480,
      background: 'white',
      borderTop: '1px solid #E2E8F0',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0',
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    },
    navItem: (active: boolean) => ({
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 4,
      padding: '8px 16px',
      background: 'none',
      border: 'none',
      color: active ? '#2563EB' : '#94A3B8',
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 600,
    }),
    card: {
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      marginBottom: 12,
      overflow: 'hidden',
    },
    quickActions: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      marginBottom: 20,
    },
    quickAction: {
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
    },
    quickActionIcon: (color: string) => ({
      width: 44,
      height: 44,
      borderRadius: 10,
      background: color === 'blue' ? '#EFF6FF' : '#F5F3FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 20,
    }),
    sectionTitle: {
      fontSize: 15,
      fontWeight: 700,
      marginBottom: 12,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    instructionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid #E2E8F0',
    },
    instructionIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      background: '#F1F5F9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
    },
    instructionContent: {
      flex: 1,
    },
    instructionTitle: {
      fontSize: 14,
      fontWeight: 600,
      marginBottom: 4,
    },
    badge: (bg: string, color: string) => ({
      display: 'inline-block',
      padding: '3px 8px',
      fontSize: 10,
      fontWeight: 600,
      borderRadius: 999,
      background: bg,
      color: color,
    }),
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      padding: '10px 14px',
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      border: 'none',
      outline: 'none',
      fontSize: 14,
      background: 'none',
    },
    chatContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      height: 'calc(100vh - 140px)',
    },
    chatMessages: {
      flex: 1,
      overflowY: 'auto' as const,
      paddingBottom: 16,
    },
    chatEmpty: {
      textAlign: 'center' as const,
      padding: '40px 20px',
    },
    chatEmptyIcon: {
      width: 64,
      height: 64,
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      fontSize: 28,
    },
    chatSuggestion: {
      padding: '12px 16px',
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      fontSize: 13,
      textAlign: 'left' as const,
      cursor: 'pointer',
      marginBottom: 8,
      width: '100%',
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
      background: isUser 
        ? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' 
        : 'white',
      color: isUser ? 'white' : '#0F172A',
      border: isUser ? 'none' : '1px solid #E2E8F0',
      fontSize: 14,
      lineHeight: 1.5,
    }),
    notFoundBubble: {
      maxWidth: '85%',
      padding: '12px 16px',
      borderRadius: 12,
      background: '#FEF3C7',
      border: '1px solid #FDE68A',
      color: '#92400E',
      fontSize: 14,
    },
    citation: {
      marginTop: 8,
      paddingTop: 8,
      borderTop: '1px solid #E2E8F0',
      fontSize: 12,
      color: '#2563EB',
    },
    chatInputContainer: {
      display: 'flex',
      gap: 8,
      paddingTop: 12,
      borderTop: '1px solid #E2E8F0',
      background: '#F8FAFC',
    },
    chatInput: {
      flex: 1,
      padding: '12px 16px',
      border: '1px solid #E2E8F0',
      borderRadius: 10,
      fontSize: 14,
      outline: 'none',
      background: 'white',
    },
    sendBtn: {
      width: 48,
      height: 48,
      border: 'none',
      borderRadius: 10,
      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
      color: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
    },
    typingIndicator: {
      display: 'flex',
      gap: 4,
      padding: '12px 16px',
      background: 'white',
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
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.logo}>
            <div style={styles.logoIcon}>T</div>
            <span style={styles.logoText}>Tetra</span>
          </div>
          <div style={styles.avatar} onClick={handleLogout} title="Logg ut">
            {getInitials(profile.full_name || 'U')}
          </div>
        </div>
        <div style={styles.greeting}>
          God dag, <strong>{profile.full_name?.split(' ')[0] || 'bruker'}</strong>
        </div>
      </header>

      <div style={styles.content}>
        {tab === 'home' && (
          <>
            <div style={styles.quickActions}>
              <div style={styles.quickAction} onClick={() => setTab('instructions')}>
                <div style={styles.quickActionIcon('blue')}>📄</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Instrukser</span>
              </div>
              <div style={styles.quickAction} onClick={() => setTab('ask')}>
                <div style={styles.quickActionIcon('purple')}>💬</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Spør Tetra</span>
              </div>
            </div>

            {criticalInstructions.length > 0 && (
              <>
                <div style={styles.sectionTitle}>🔴 Kritiske instrukser</div>
                <div style={styles.card}>
                  <div style={{ padding: '4px 16px' }}>
                    {criticalInstructions.slice(0, 3).map(inst => (
                      <div key={inst.id} style={styles.instructionItem}>
                        <div style={styles.instructionIcon}>📄</div>
                        <div style={styles.instructionContent}>
                          <div style={styles.instructionTitle}>{inst.title}</div>
                          <span style={styles.badge('#FEF2F2', '#DC2626')}>Kritisk</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div style={styles.sectionTitle}>📋 Siste instrukser</div>
            <div style={styles.card}>
              <div style={{ padding: '4px 16px' }}>
                {instructions.slice(0, 5).map(inst => (
                  <div key={inst.id} style={styles.instructionItem}>
                    <div style={styles.instructionIcon}>📄</div>
                    <div style={styles.instructionContent}>
                      <div style={styles.instructionTitle}>{inst.title}</div>
                      <span style={styles.badge(
                        severityColor(inst.severity).bg,
                        severityColor(inst.severity).color
                      )}>
                        {severityLabel(inst.severity)}
                      </span>
                    </div>
                  </div>
                ))}
                {instructions.length === 0 && (
                  <p style={{ color: '#64748B', padding: '12px 0' }}>
                    Ingen instrukser tilgjengelig
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'instructions' && (
          <>
            <div style={styles.searchBox}>
              <span>🔍</span>
              <input
                style={styles.searchInput}
                placeholder="Søk i instrukser..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={styles.card}>
              <div style={{ padding: '4px 16px' }}>
                {filteredInstructions.map(inst => (
                  <div key={inst.id} style={styles.instructionItem}>
                    <div style={styles.instructionIcon}>📄</div>
                    <div style={styles.instructionContent}>
                      <div style={styles.instructionTitle}>{inst.title}</div>
                      <span style={styles.badge(
                        severityColor(inst.severity).bg,
                        severityColor(inst.severity).color
                      )}>
                        {severityLabel(inst.severity)}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredInstructions.length === 0 && (
                  <p style={{ color: '#64748B', padding: '12px 0' }}>
                    {searchQuery ? 'Ingen treff' : 'Ingen instrukser tilgjengelig'}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        {tab === 'ask' && (
          <div style={styles.chatContainer}>
            <div style={styles.chatMessages} ref={chatRef}>
              {messages.length === 0 ? (
                <div style={styles.chatEmpty}>
                  <div style={styles.chatEmptyIcon}>💬</div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                    Spør Tetra
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748B', marginBottom: 20 }}>
                    Still spørsmål om rutiner, sikkerhet eller prosedyrer.
                  </p>
                  
                  <button 
                    style={styles.chatSuggestion}
                    onClick={() => handleSuggestion('Hva gjør jeg ved brann?')}
                  >
                    🔥 Hva gjør jeg ved brann?
                  </button>
                  <button 
                    style={styles.chatSuggestion}
                    onClick={() => handleSuggestion('Hvilket verneutstyr trenger jeg?')}
                  >
                    🦺 Hvilket verneutstyr trenger jeg?
                  </button>
                  <button 
                    style={styles.chatSuggestion}
                    onClick={() => handleSuggestion('Hvordan rapporterer jeg avvik?')}
                  >
                    📝 Hvordan rapporterer jeg avvik?
                  </button>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div key={idx}>
                      {msg.type === 'user' && (
                        <div style={styles.message(true)}>
                          <div style={styles.messageBubble(true)}>{msg.text}</div>
                        </div>
                      )}
                      {msg.type === 'bot' && (
                        <div style={styles.message(false)}>
                          <div style={styles.messageBubble(false)}>
                            {msg.text}
                            {msg.citation && (
                              <div style={styles.citation}>
                                📄 Kilde: {msg.citation}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {msg.type === 'notfound' && (
                        <div style={styles.message(false)}>
                          <div style={styles.notFoundBubble}>
                            <strong>Fant ikke relevant instruks.</strong>
                            <div style={{ fontSize: 13, marginTop: 4 }}>
                              Kontakt din nærmeste leder hvis dette haster.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isTyping && (
                    <div style={styles.message(false)}>
                      <div style={styles.typingIndicator}>
                        <div style={{ ...styles.typingDot, animationDelay: '0s' }}></div>
                        <div style={{ ...styles.typingDot, animationDelay: '0.2s' }}></div>
                        <div style={{ ...styles.typingDot, animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div style={styles.chatInputContainer}>
              <input
                style={styles.chatInput}
                placeholder="Skriv et spørsmål..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
              />
              <button style={styles.sendBtn} onClick={handleAsk}>
                ➤
              </button>
            </div>
          </div>
        )}
      </div>

      <nav style={styles.nav}>
        <button style={styles.navItem(tab === 'home')} onClick={() => setTab('home')}>
          <span style={{ fontSize: 20 }}>🏠</span>
          <span>Hjem</span>
        </button>
        <button style={styles.navItem(tab === 'instructions')} onClick={() => setTab('instructions')}>
          <span style={{ fontSize: 20 }}>📄</span>
          <span>Instrukser</span>
        </button>
        <button style={styles.navItem(tab === 'ask')} onClick={() => setTab('ask')}>
          <span style={{ fontSize: 20 }}>💬</span>
          <span>Spør Tetra</span>
        </button>
      </nav>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  )
}