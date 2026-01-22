"use client";

import { Eye, Clock, Users } from "lucide-react";
import type { UnansweredQuestion, Instruction } from "@/lib/types";
import { StatCard } from "@/components/dashboard/stat-card";

type Props = {
  unansweredQuestions: UnansweredQuestion[];
  instructions: Instruction[];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function InsightsTab({ unansweredQuestions: _unansweredQuestions, instructions }: Props) {
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
          title="Aktive brukere denne uken"
          value={42}
          trend={{ value: 8, isPositive: true }}
          icon={Users}
        />
        <StatCard
          title="Dokumentvisninger"
          value="1,234"
          trend={{ value: 15, isPositive: true }}
          icon={Eye}
        />
        <StatCard
          title="Gjennomsnittlig lesetid"
          value="4.2 min"
          trend={{ value: 5, isPositive: false }}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">
            Brukeraktivitet siste 7 dager
          </h3>
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary/20 rounded-t-md transition-all duration-500 hover:bg-primary/40"
                  style={{ height: `${height}%` }}
                >
                  <div
                    className="w-full bg-primary rounded-t-md transition-all duration-500"
                    style={{ height: `${height * 0.7}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">
            Mest leste dokumenter
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
      </div>

      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">Samsvarsoversikt</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Kurs fullført", value: 94, color: "bg-primary" },
            { label: "Lesebekreftelser", value: 87, color: "bg-chart-2" },
            { label: "Dokumenter oppdatert", value: 100, color: "bg-chart-4" },
            { label: "GDPR-samsvar", value: 100, color: "bg-chart-3" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center p-4 rounded-lg bg-muted/30"
            >
              <div className="relative w-20 h-20 mb-3">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-muted"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={`${item.value * 2.26} 226`}
                    className={item.color.replace("bg-", "text-")}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-foreground">
                    {item.value}%
                  </span>
                </div>
              </div>
              <span className="text-sm text-muted-foreground text-center">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
