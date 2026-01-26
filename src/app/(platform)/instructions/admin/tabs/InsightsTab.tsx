"use client";

import { Eye, MessageCircleQuestion, FileText, HelpCircle } from "lucide-react";
import type { Instruction } from "@/lib/types";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  instructions: Instruction[];
  insightStats: {
    instructionsOpened: number;
    aiQuestions: number;
    unanswered: number;
  };
};

export default function InsightsTab({ instructions, insightStats }: Props) {
  // Use real instruction data for "popular docs" display
  const publishedInstructions = instructions.filter(i => i.status === "published");
  const topInstructions = publishedInstructions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Innsikt
        </h1>
        <p className="text-muted-foreground mt-1">
          Analyser og statistikk for din organisasjon
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Instrukser åpnet"
          value={insightStats.instructionsOpened}
          description="Totalt åpnet av ansatte"
          icon={Eye}
        />
        <StatCard
          title="Spørsmål stilt til AI"
          value={insightStats.aiQuestions}
          description="Totalt antall spørsmål"
          icon={MessageCircleQuestion}
        />
        <StatCard
          title="Ubesvarte spørsmål"
          value={insightStats.unanswered}
          description="Venter på oppfølging"
          icon={HelpCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Publiserte instrukser
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topInstructions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ingen publiserte instrukser ennå.
              </p>
            ) : (
              <div className="space-y-3">
                {topInstructions.map((instruction) => (
                  <div
                    key={instruction.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-foreground truncate pr-4">
                      {instruction.title}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {instruction.severity === "critical"
                        ? "Kritisk"
                        : instruction.severity === "medium"
                        ? "Middels"
                        : "Lav"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sammendrag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Totalt instrukser
              </span>
              <span className="text-sm font-medium text-foreground">
                {instructions.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Publiserte
              </span>
              <span className="text-sm font-medium text-foreground">
                {publishedInstructions.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Totalt lesetall
              </span>
              <span className="text-sm font-medium text-foreground">
                {insightStats.instructionsOpened}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                AI-interaksjoner
              </span>
              <span className="text-sm font-medium text-foreground">
                {insightStats.aiQuestions}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
