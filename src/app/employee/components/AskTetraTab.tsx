'use client'

import {
  MessageCircle,
  Send,
  FileText,
  Flame,
  HardHat,
  PenLine
} from 'lucide-react'
import type { ChatMessage } from '@/lib/types'

type Props = {
  messages: ChatMessage[]
  isTyping: boolean
  chatInput: string
  setChatInput: (value: string) => void
  chatRef: React.RefObject<HTMLDivElement | null>
  onAsk: () => void
  onSuggestion: (suggestion: string) => void
  onOpenSource: (instructionId: string) => void
  isMobile: boolean
}

export default function AskTetraTab({
  messages,
  isTyping,
  chatInput,
  setChatInput,
  chatRef,
  onAsk,
  onSuggestion,
  onOpenSource,
  isMobile
}: Props) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? 'calc(100vh - 140px)' : '700px',
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-default)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: 'var(--space-5)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        background: 'var(--bg-elevated)'
      }}>
        <MessageCircle size={22} style={{ color: 'var(--color-primary-600)' }} aria-hidden="true" />
        <span style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Spør Tetra</span>
      </div>
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-5)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)'
        }}
      >
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: 'var(--space-6)'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary-700)',
              marginBottom: 'var(--space-4)'
            }}>
              <MessageCircle size={32} aria-hidden="true" />
            </div>
            <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
              Still et spørsmål
            </h3>
            <p style={{ fontSize: '0.875rem', marginBottom: 'var(--space-6)', lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: 320 }}>
              Spør om rutiner, sikkerhet eller prosedyrer.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%', maxWidth: 400 }}>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={() => onSuggestion('Hva gjør jeg ved brann?')}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-elevated)'
                  e.currentTarget.style.borderColor = 'var(--border-strong)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                }}
              >
                <Flame size={18} style={{ color: '#EA580C', flexShrink: 0 }} aria-hidden="true" />
                Hva gjør jeg ved brann?
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={() => onSuggestion('Hvilket verneutstyr trenger jeg?')}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-elevated)'
                  e.currentTarget.style.borderColor = 'var(--border-strong)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                }}
              >
                <HardHat size={18} style={{ color: 'var(--color-primary-600)', flexShrink: 0 }} aria-hidden="true" />
                Hvilket verneutstyr trenger jeg?
              </button>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
                onClick={() => onSuggestion('Hvordan rapporterer jeg avvik?')}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--bg-elevated)'
                  e.currentTarget.style.borderColor = 'var(--border-strong)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                }}
              >
                <PenLine size={18} style={{ color: '#059669', flexShrink: 0 }} aria-hidden="true" />
                Hvordan rapporterer jeg avvik?
              </button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const notFoundMessage = msg.type === 'notfound' ? msg.text.trim() : ''
              return (
                <div key={idx}>
                  {msg.type === 'user' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))',
                        color: 'white',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.5
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  )}
                  {msg.type === 'bot' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.5,
                        color: 'var(--text-primary)'
                      }}>
                        {msg.text}
                        {msg.source && (
                          <div style={{
                            marginTop: 'var(--space-3)',
                            paddingTop: 'var(--space-3)',
                            borderTop: '1px solid var(--border-subtle)',
                            fontSize: '0.8125rem'
                          }}>
                            <div style={{ marginBottom: 'var(--space-2)', color: 'var(--text-secondary)' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>Kilde:</strong> {msg.source.title}
                              {msg.source.updated_at && (
                                <> (oppdatert {new Date(msg.source.updated_at).toLocaleDateString('nb-NO')})</>
                              )}
                            </div>
                            <div
                              style={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                fontWeight: 600,
                                color: 'var(--color-primary-600)',
                                transition: 'color var(--transition-fast)'
                              }}
                              onClick={() => onOpenSource(msg.source!.instruction_id)}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary-700)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-primary-600)'}
                            >
                              <FileText size={14} aria-hidden="true" />
                              Klikk for å åpne: {msg.source.title}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {msg.type === 'notfound' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: 'var(--space-3) var(--space-4)',
                        background: 'linear-gradient(135deg, var(--color-warning-50), var(--color-warning-100))',
                        border: '2px solid var(--color-warning-200)',
                        borderRadius: 'var(--radius-lg)',
                        fontSize: '0.9375rem',
                        lineHeight: 1.5,
                        color: 'var(--color-warning-800)'
                      }}>
                        <strong>{notFoundMessage || 'Fant ikke relevant instruks.'}</strong>
                        {!notFoundMessage && (
                          <div style={{ fontSize: '0.8125rem', marginTop: 'var(--space-2)' }}>
                            Kontakt din nærmeste leder hvis dette haster.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  gap: 'var(--space-2)',
                  alignItems: 'center'
                }}>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div style={{
        padding: 'var(--space-4)',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        display: 'flex',
        gap: 'var(--space-3)'
      }}>
        <input
          style={{
            flex: 1,
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            transition: 'border-color var(--transition-fast)'
          }}
          placeholder="Skriv et spørsmål..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAsk()}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary-400)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
        />
        <button
          style={{
            padding: 'var(--space-3)',
            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            transition: 'opacity var(--transition-fast)'
          }}
          onClick={onAsk}
          aria-label="Send melding"
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Send size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
