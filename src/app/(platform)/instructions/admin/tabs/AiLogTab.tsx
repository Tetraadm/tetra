"use client";

import { MessageCircleQuestion, Clock } from "lucide-react";
import type { UnansweredQuestion } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type Props = {
  unansweredQuestions: UnansweredQuestion[];
};

export default function AiLogTab({ unansweredQuestions }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Ubesvarte AI-spørsmål
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-assistenten kunne ikke besvare disse spørsmålene
        </p>
      </div>

      <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
          <MessageCircleQuestion className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h3 className="font-medium text-foreground mb-1">
            {unansweredQuestions.length} spørsmål venter på svar
          </h3>
          <p className="text-sm text-muted-foreground">
            Disse spørsmålene kunne ikke besvares automatisk. Legg til
            informasjon i kunnskapsbasen for å forbedre AI-assistenten.
          </p>
        </div>
      </div>

      {unansweredQuestions.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
          <MessageCircleQuestion className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="font-semibold text-lg mb-2">Ingen ubesvarte spørsmål</h3>
          <p className="text-sm">Alle spørsmål ble besvart av AI.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {unansweredQuestions.map((question) => (
            <div key={question.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(question.profiles?.full_name || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {question.question}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-2">
                      <span>{question.profiles?.full_name || "System"}</span>
                      <span aria-hidden="true">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(question.created_at).toLocaleString("nb-NO", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="h-fit">
                    Ubesvart
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
