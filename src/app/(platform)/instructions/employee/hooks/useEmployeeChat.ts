import { useCallback, useEffect, useRef, useState, startTransition } from 'react'
import type { Profile, ChatMessage } from '@/lib/types'

type UseEmployeeChatOptions = {
  profile: Profile
  onOpenSource?: (instructionId: string) => void
}

// Throttle function for smoother streaming updates
function throttle(fn: (text: string) => void, delay: number): (text: string) => void {
  let lastCall = 0
  let timeoutId: NodeJS.Timeout | null = null
  let lastText = ''
  
  return (text: string) => {
    lastText = text
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      fn(text)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn(lastText)
      }, delay - (now - lastCall))
    }
  }
}

export function useEmployeeChat({ profile, onOpenSource }: UseEmployeeChatOptions) {
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const accumulatedTextRef = useRef('')

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages, streamingText])

  const handleAsk = useCallback(async () => {
    const question = chatInput.trim()
    if (!question) return

    setMessages(prev => [...prev, { type: 'user', text: question }])
    setChatInput('')
    setIsTyping(true)
    setStreamingText('')

    try {
      // Use streaming mode
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          orgId: profile.org_id,
          userId: profile.id,
          stream: true
        })
      })

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setMessages(prev => [...prev, {
            type: 'notfound',
            text: 'Din sesjon er utløpt. Vennligst logg inn på nytt.'
          }])
          return
        }
        // Try to parse error JSON
        try {
          const errorData = await response.json()
          if (response.status === 429) {
            const message = errorData?.error || 'For mange forespørsler. Prøv igjen om litt.'
            setMessages(prev => [...prev, { type: 'notfound', text: message }])
            return
          }
          throw new Error(errorData?.error || `HTTP ${response.status}`)
        } catch {
          throw new Error(`HTTP ${response.status}`)
        }
      }

      // Check if streaming response
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        accumulatedTextRef.current = ''
        let source: ChatMessage['source'] | undefined

        setIsTyping(false) // Hide typing indicator when streaming starts

        // Throttled update function (30ms = ~33fps, smooth enough for text)
        const updateStreamingText = throttle((text: string) => {
          startTransition(() => {
            setStreamingText(text)
          })
        }, 30)

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === 'text') {
                  accumulatedTextRef.current += data.content
                  updateStreamingText(accumulatedTextRef.current)
                } else if (data.type === 'source') {
                  source = data.content
                } else if (data.type === 'done') {
                  // Finalize the message
                  const finalText = accumulatedTextRef.current
                  setMessages(prev => [...prev, {
                    type: 'bot',
                    text: finalText,
                    source
                  }])
                  setStreamingText('')
                  accumulatedTextRef.current = ''
                } else if (data.type === 'error') {
                  throw new Error(data.content)
                }
              } catch (parseError) {
                // Skip malformed JSON chunks (normal for partial SSE data)
                if (process.env.NODE_ENV === 'development') {
                  console.warn('Failed to parse SSE chunk:', parseError)
                }
              }
            }
          }
        }
      } else {
        // Handle non-streaming response (fallback)
        const data = await response.json()

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
      }
    } catch (error) {
      console.error('Ask error:', error)
      setStreamingText('')
      setMessages(prev => [...prev, {
        type: 'notfound',
        text: 'Kunne ikke koble til Tetrivo. Sjekk nettforbindelsen din og prøv igjen.'
      }])
    } finally {
      setIsTyping(false)
      setStreamingText('')
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
    streamingText,
    chatRef,
    handleAsk,
    handleSuggestion,
    handleOpenSource
  }
}
