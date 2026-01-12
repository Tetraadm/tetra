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

      let data: { answer?: string; source?: ChatMessage['source']; error?: string } | null = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        if (response.status === 429) {
          const message = data?.error || 'For mange forespørsler. Prøv igjen om litt.'
          setMessages(prev => [...prev, { type: 'notfound', text: message }])
          return
        }
        throw new Error(data?.error || `HTTP ${response.status}`)
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      const answer = data?.answer
      const source = data?.source
      if (typeof answer === 'string') {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: answer,
          source
        }])
      } else {
        setMessages(prev => [...prev, { type: 'notfound', text: '' }])
      }
    } catch (error) {
      console.error('Ask error:', error)
      setMessages(prev => [...prev, {
        type: 'notfound',
        text: 'Kunne ikke koble til Tetra. Sjekk nettforbindelsen din og prøv igjen.'
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
