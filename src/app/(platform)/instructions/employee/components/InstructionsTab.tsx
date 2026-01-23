"use client";

import { useMemo, useState } from "react";
import {
  Search,
  FileText,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  BookOpen,
} from "lucide-react";
import type { Instruction } from "@/lib/types";
import { severityColor, severityLabel } from "@/lib/ui-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

type SortMode = "newest" | "severity";

type Props = {
  instructions: Instruction[];
  confirmedInstructions: Set<string>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredInstructions: Instruction[];
  onSelectInstruction: (instruction: Instruction) => void;
};

export default function InstructionsTab({
  instructions,
  confirmedInstructions,
  searchQuery,
  setSearchQuery,
  filteredInstructions,
  onSelectInstruction,
}: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const completedCount = instructions.filter((inst) =>
    confirmedInstructions.has(inst.id)
  ).length;
  const progress = instructions.length
    ? Math.round((completedCount / instructions.length) * 100)
    : 0;

  const visibleInstructions = useMemo(() => {
    const items = [...filteredInstructions];
    if (sortMode === "severity") {
      const severityRank: Record<string, number> = {
        critical: 0,
        medium: 1,
        low: 2,
      };
      items.sort((a, b) => {
        const rankDiff =
          (severityRank[a.severity] ?? 99) - (severityRank[b.severity] ?? 99);
        if (rankDiff !== 0) return rankDiff;
        const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bDate - aDate;
      });
      return items;
    }

    items.sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    });

    return items;
  }, [filteredInstructions, sortMode]);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Din fremgang</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Du har fullført {completedCount} av {instructions.length} instrukser
              </p>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{progress}%</p>
                <p className="text-xs text-muted-foreground">Fullført</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {instructions.length - completedCount}
                </p>
                <p className="text-xs text-muted-foreground">Gjenstår</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter instrukser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortMode === "newest" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortMode("newest")}
            className="h-11 px-4"
          >
            <Clock className="w-4 h-4 mr-2" />
            Nyeste
          </Button>
          <Button
            variant={sortMode === "severity" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortMode("severity")}
            className="h-11 px-4"
          >
            <Filter className="w-4 h-4 mr-2" />
            Viktighetsgrad
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Instrukser ({visibleInstructions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {visibleInstructions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">
                {searchQuery ? "Ingen treff" : "Ingen instrukser tilgjengelig"}
              </h3>
              <p className="max-w-sm text-sm">
                {searchQuery
                  ? "Prøv å søke med et annet nøkkelord eller fjern søket."
                  : "Det er ingen instrukser tildelt deg for øyeblikket."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {visibleInstructions.map((instruction) => {
                const isCompleted = confirmedInstructions.has(instruction.id);
                const severityStyles = severityColor(instruction.severity);
                return (
                  <button
                    key={instruction.id}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-all hover:-translate-y-0.5 hover:shadow-sm text-left min-h-[72px]"
                    onClick={() => onSelectInstruction(instruction)}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        isCompleted ? "bg-success/10" : "bg-warning/10"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <FileText className="w-5 h-5 text-warning" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground truncate">
                          {instruction.title}
                        </p>
                        {!isCompleted && (
                          <Badge
                            variant="secondary"
                            className="bg-chart-2/10 text-chart-2 text-[10px]"
                          >
                            Ny
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: severityStyles.bg,
                            color: severityStyles.color,
                            borderColor: severityStyles.border,
                          }}
                        >
                          {severityLabel(instruction.severity)}
                        </Badge>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">
                          {isCompleted ? "Fullført" : "Venter"}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
