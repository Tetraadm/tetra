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
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  messages: ChatMessage[]
  isTyping: boolean
  streamingText?: string // NEW: Text being streamed in real-time
  chatInput: string
  setChatInput: (value: string) => void
  chatRef: React.RefObject<HTMLDivElement | null>
  onAsk: () => void
  onSuggestion: (suggestion: string) => void
  onOpenSource: (instructionId: string) => void
}

export default function AskTetraTab({
  messages,
  isTyping,
  streamingText,
  chatInput,
  setChatInput,
  chatRef,
  onAsk,
  onSuggestion,
  onOpenSource
}: Props) {
  return (
    <Card className="h-[calc(100vh-140px)] md:h-[700px] flex flex-col overflow-hidden border-border bg-card shadow-sm">
      <CardHeader className="border-b px-6 py-4 bg-card">
        <CardTitle className="flex items-center gap-3 text-lg">
          <MessageCircle className="h-5 w-5 text-primary" />
          Spør Tetrivo
        </CardTitle>
      </CardHeader>

      <div
        ref={chatRef}
        className="flex-1 overflow-y-auto p-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
              <MessageCircle size={32} />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">
              Still et spørsmål
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">
              Spør om rutiner, sikkerhet eller prosedyrer.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-sm">
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3 px-4 font-normal hover:bg-secondary/50"
                onClick={() => onSuggestion('Hva gjør jeg ved brann?')}
              >
                <Flame className="h-4 w-4 text-orange-600 shrink-0" />
                Hva gjør jeg ved brann?
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3 px-4 font-normal hover:bg-secondary/50"
                onClick={() => onSuggestion('Hvilket verneutstyr trenger jeg?')}
              >
                <HardHat className="h-4 w-4 text-primary shrink-0" />
                Hvilket verneutstyr trenger jeg?
              </Button>
              <Button
                variant="outline"
                className="justify-start gap-3 h-auto py-3 px-4 font-normal hover:bg-secondary/50"
                onClick={() => onSuggestion('Hvordan rapporterer jeg avvik?')}
              >
                <PenLine className="h-4 w-4 text-emerald-600 shrink-0" />
                Hvordan rapporterer jeg avvik?
              </Button>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const notFoundMessage = msg.type === 'notfound' ? msg.text.trim() : ''
              return (
                <div key={idx}>
                  {msg.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] px-4 py-3 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  )}
                  {msg.type === 'bot' && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] px-4 py-3 bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm text-sm leading-relaxed border border-border/50">
                        {msg.text}
                        {msg.source && (
                          <div className="mt-3 pt-3 border-t border-border/50 text-xs">
                            <div className="mb-2 text-muted-foreground">
                              <span className="font-medium text-foreground">Kilde:</span> {msg.source.title}
                              {msg.source.updated_at && (
                                <span className="opacity-70"> (oppdatert {new Date(msg.source.updated_at).toLocaleDateString('nb-NO')})</span>
                              )}
                            </div>
                            <button
                              className="flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer"
                              onClick={() => onOpenSource(msg.source!.instruction_id)}
                            >
                              <FileText size={14} />
                              Klikk for å åpne: {msg.source.title}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {msg.type === 'notfound' && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] px-4 py-3 bg-warning/10 text-warning-foreground border border-warning/20 rounded-2xl rounded-tl-sm text-sm leading-relaxed">
                        <strong className="block mb-1">{notFoundMessage || 'Fant ikke relevant instruks.'}</strong>
                        {!notFoundMessage && (
                          <span className="text-xs opacity-90">
                            Kontakt din nærmeste leder hvis dette haster.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 bg-secondary border border-border/50 rounded-2xl rounded-tl-sm w-16 flex items-center justify-center">
                  <div className="typing-indicator">
                    <div className="typing-dot bg-muted-foreground/50"></div>
                    <div className="typing-dot bg-muted-foreground/50"></div>
                    <div className="typing-dot bg-muted-foreground/50"></div>
                  </div>
                </div>
              </div>
            )}
            {streamingText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 bg-secondary text-secondary-foreground rounded-2xl rounded-tl-sm text-sm leading-relaxed border border-border/50">
                  {streamingText}
                  <span className="inline-block w-2 h-4 ml-1 bg-primary/60 animate-pulse" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t bg-card flex gap-3">
        <Input
          className="flex-1 bg-secondary/30"
          placeholder="Skriv et spørsmål..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onAsk()}
        />
        <Button
          onClick={onAsk}
          size="icon"
          className="shrink-0"
          disabled={!chatInput.trim()}
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </Card>
  )
}
