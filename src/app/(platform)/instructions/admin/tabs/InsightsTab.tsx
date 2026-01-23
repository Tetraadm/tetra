"use client";

import { Eye, MessageCircleQuestion, FileText } from "lucide-react";
import type { Instruction } from "@/lib/types";
import { StatCard } from "@/components/dashboard/stat-card";

type Props = {
  instructions: Instruction[];
  insightStats: {
    instructionsOpened: number;
    aiQuestions: number;
    unanswered: number;
  };
};

export default function InsightsTab({ instructions, insightStats }: Props) {
  const fallbackDocs = [
    { name: "Brannverninstruks", views: 234, percent: 100 },
    { name: "Verneutstyr - bruk og vedlikehold", views: 198, percent: 85 },
    { name: "Rutiner for farlig avfall", views: 156, percent: 67 },
    { name: "Førstehjelpsprosedyrer", views: 134, percent: 57 },
    { name: "Ergonomi på arbeidsplassen", views: 89, percent: 38 },
  ];
  const popularDocs = instructions.length
    ? instructions.slice(0, 5).map((instruction, index) => ({
      name: instruction.title,
      views: Math.max(80, 240 - index * 35),
      percent: Math.max(35, 100 - index * 15),
    }))
    : fallbackDocs;

  const statusItems = [
    { label: "Lesebekreftelser", value: 87, color: "bg-chart-2" },
    { label: "Dokumenter oppdatert", value: 100, color: "bg-chart-4" },
  ];

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
          description="Siste 90 dager"
          icon={MessageCircleQuestion}
        />
        <StatCard
          title="Ubesvarte spørsmål"
          value={insightStats.unanswered}
          description="Venter på oppfølging"
          icon={FileText}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">
            Mest leste instrukser
          </h3>
          <div className="space-y-4">
            {popularDocs.map((doc, index) => (
              <div key={`${doc.name}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate pr-4">
                    {doc.name}
                  </span>
                  <span className="text-muted-foreground flex-shrink-0">
                    {doc.views}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${doc.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">Status</h3>
          <div className="space-y-4">
            {statusItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
