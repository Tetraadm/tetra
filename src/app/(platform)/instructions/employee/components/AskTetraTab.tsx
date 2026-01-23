"use client";

import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ChatMessage } from "@/lib/types";
import {
  Send,
  Bot,
  User,
  Sparkles,
  FileText,
  Shield,
  Flame,
  HelpCircle,
} from "lucide-react";

type Props = {
  messages: ChatMessage[];
  isTyping: boolean;
  streamingText?: string;
  chatInput: string;
  setChatInput: (value: string) => void;
  chatRef: React.RefObject<HTMLDivElement | null>;
  onAsk: () => void;
  onSuggestion: (suggestion: string) => void;
  onOpenSource: (instructionId: string) => void;
};

const suggestedQuestions = [
  {
    icon: Flame,
    text: "Hva gjør jeg ved brann på arbeidsplassen?",
  },
  {
    icon: Shield,
    text: "Hvilke HMS-rutiner gjelder for kontoret?",
  },
  {
    icon: FileText,
    text: "Hvor finner jeg sikkerhetsdatabladene?",
  },
  {
    icon: HelpCircle,
    text: "Hvordan rapporterer jeg et avvik?",
  },
];

export default function AskTetraTab({
  messages,
  isTyping,
  streamingText,
  chatInput,
  setChatInput,
  chatRef,
  onAsk,
  onSuggestion,
  onOpenSource,
}: Props) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onAsk();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)]">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Image
              src="/tetrivo-logo.png"
              alt="Tetrivo AI"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
            Spør Tetrivo AI
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-md">
            Jeg kan hjelpe deg med spørsmål om HMS, sikkerhet og
            arbeidsplassrutiner. Still et spørsmål nedenfor.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
            {suggestedQuestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <button
                  key={index}
                  onClick={() => onSuggestion(suggestion.text)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-muted/50 hover:border-primary/30 transition-all hover:-translate-y-0.5 hover:shadow-md text-left min-h-[60px]"
                >
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">
                    {suggestion.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => {
            const notFoundMessage =
              message.type === "notfound" ? message.text.trim() : "";

            return (
              <div key={index}>
                {message.type === "user" && (
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.text}
                      </p>
                    </div>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-secondary">
                        <User className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                {message.type === "bot" && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10">
                        <Bot className="w-4 h-4 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-muted text-foreground border border-border/50">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.text}
                      </p>
                      {message.source && (
                        <div className="mt-3 pt-3 border-t border-border/50 text-xs">
                          <div className="mb-2 text-muted-foreground">
                            <span className="font-medium text-foreground">
                              Kilde:
                            </span>{" "}
                            {message.source.title}
                            {message.source.updated_at && (
                              <span className="opacity-70">
                                {" "}(oppdatert{" "}
                                {new Date(
                                  message.source.updated_at
                                ).toLocaleDateString("nb-NO")}
                                )
                              </span>
                            )}
                          </div>
                          <button
                            className="flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 transition-colors"
                            onClick={() =>
                              onOpenSource(message.source!.instruction_id)
                            }
                          >
                            <FileText size={14} />
                            Åpne instruks: {message.source.title}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {message.type === "notfound" && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-amber-500/10">
                        <HelpCircle className="w-4 h-4 text-amber-500" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-warning/10 text-foreground border border-warning/30">
                      <strong className="block mb-1 text-warning">
                        {notFoundMessage || "Fant ikke relevant instruks."}
                      </strong>
                      {!notFoundMessage && (
                        <span className="text-xs opacity-90">
                          Kontakt din nærmeste leder hvis dette haster.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">Tenker...</span>
                </div>
              </div>
            </div>
          )}

          {streamingText && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary/10">
                  <Bot className="w-4 h-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-muted text-foreground border border-border/50">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-2 h-4 ml-1 bg-primary/60 animate-pulse" />
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border bg-card p-4">
        <Card className="shadow-sm">
          <CardContent className="p-2">
            <div className="flex items-end gap-2">
              <Textarea
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Skriv et spørsmål om HMS..."
                className="min-h-[44px] max-h-32 resize-none border-0 focus-visible:ring-0 text-base"
                rows={1}
              />
              <Button
                onClick={onAsk}
                disabled={!chatInput.trim()}
                size="icon"
                className="h-11 w-11 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Tetrivo AI gir svar basert på bedriftens HMS-dokumentasjon
        </p>
      </div>
    </div>
  );
}
