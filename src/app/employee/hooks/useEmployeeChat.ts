import { useCallback, useEffect, useRef, useState } from 'react'
import type { Profile, ChatMessage } from '@/lib/types'

type UseEmployeeChatOptions = {
  profile: Profile
  onOpenSource?: (instructionId: string) => void
}

export function useEmployeeChat({ profile, onOpenSource }: UseEmployeeChatOptions) {
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const handleAsk = useCallback(async () => {
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
          source: data.source || undefined
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
  }, [chatInput, profile.id, profile.org_id])

  const handleSuggestion = useCallback((q: string) => setChatInput(q), [])

  const handleOpenSource = useCallback((sourceId: string) => {
    if (onOpenSource) {
      onOpenSource(sourceId)
    }
  }, [onOpenSource])

  return {
    chatInput,
    setChatInput,
    messages,
    isTyping,
    chatRef,
    handleAsk,
    handleSuggestion,
    handleOpenSource
  }
}
