"use client";

import {
  AlertTriangle,
  FileText,
  Zap,
  Bell,
  ArrowRight,
  CheckCircle2,
  Clock,
  BookOpen,
  MessageCircle,
} from "lucide-react";
import type { Alert, Instruction } from "@/lib/types";
import { severityLabel } from "@/lib/ui-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type Props = {
  userName?: string;
  alerts: Alert[];
  instructions: Instruction[];
  criticalInstructions: Instruction[];
  confirmedCount: number;
  onTabChange: (tab: "instrukser" | "spor") => void;
  onSelectInstruction: (instruction: Instruction) => void;
};

export default function HomeContent({
  userName,
  alerts,
  instructions,
  criticalInstructions,
  confirmedCount,
  onTabChange,
  onSelectInstruction,
}: Props) {
  const totalInstructions = instructions.length;
  const progress = totalInstructions
    ? Math.round((confirmedCount / totalInstructions) * 100)
    : 0;
  const firstName = userName ? userName.split(" ")[0] : "";

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-[var(--warning)]" />
            Aktive kunngjøringer
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isCritical = alert.severity === "critical";
              return (
                <div
                  key={alert.id}
                  className={cn(
                    "flex gap-4 p-5 rounded-lg border-2",
                    isCritical
                      ? "bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20"
                      : "bg-[var(--warning-soft)] border-[var(--warning-border)]"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-5 w-5 mt-0.5 shrink-0",
                      isCritical ? "text-destructive" : "text-[var(--warning)]"
                    )}
                  />
                  <div className="flex-1">
                    <Badge
                      variant={isCritical ? "destructive" : "outline"}
                      className={cn(
                        !isCritical &&
                          "border-[var(--warning-border)] text-[var(--warning)] bg-[var(--warning-soft)]"
                      )}
                    >
                      {severityLabel(alert.severity)}
                    </Badge>
                    <div className="font-semibold mt-2 text-foreground">
                      {alert.title}
                    </div>
                    {alert.description && (
                      <div className="text-sm mt-2 text-muted-foreground leading-relaxed">
                        {alert.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-1">
                Velkommen tilbake{firstName ? `, ${firstName}` : ""}!
              </h2>
              <p className="text-muted-foreground">
                Du har {totalInstructions} instrukser tilgjengelig i dag.
              </p>
            </div>
            <Button
              onClick={() => onTabChange("instrukser")}
              className="min-h-[44px]"
            >
              Se instrukser
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalInstructions}
                </p>
                <p className="text-xs text-muted-foreground">Totalt instrukser</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {confirmedCount}
                </p>
                <p className="text-xs text-muted-foreground">Fullført</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {criticalInstructions.length}
                </p>
                <p className="text-xs text-muted-foreground">Kritiske</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Bell className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {alerts.length}
                </p>
                <p className="text-xs text-muted-foreground">Varsler</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Din opplæringsstatus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Fullførte instrukser</span>
                <span className="font-medium text-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              {confirmedCount} av {totalInstructions} instrukser fullført.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Snarveier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => onTabChange("instrukser")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-all hover:-translate-y-0.5 hover:shadow-md text-left min-h-[60px]"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">Se alle instrukser</p>
                <p className="text-sm text-muted-foreground">
                  Bla gjennom HMS-dokumenter
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <button
              onClick={() => onTabChange("spor")}
              className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-all hover:-translate-y-0.5 hover:shadow-md text-left min-h-[60px]"
            >
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">Spor Tetrivo AI</p>
                <p className="text-sm text-muted-foreground">
                  Få svar på HMS-spørsmål
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>
      </div>

      {criticalInstructions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-destructive">
            <Zap className="h-5 w-5" />
            Kritiske instrukser
          </h2>
          <Card>
            <CardContent className="p-0 divide-y">
              {criticalInstructions.slice(0, 3).map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectInstruction(inst)}
                >
                  <div className="h-10 w-10 rounded-md bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1 truncate">{inst.title}</div>
                    <Badge variant="destructive">
                      {severityLabel(inst.severity)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-muted-foreground">
          <Clock className="h-5 w-5" />
          Siste instrukser
        </h2>
        {instructions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-lg bg-muted/5">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <h3 className="font-semibold text-lg mb-2">
              Ingen instrukser tilgjengelig
            </h3>
            <p className="max-w-sm text-sm">
              Det er ingen instrukser tildelt deg for øyeblikket. Instrukser vil
              vises her når de blir publisert.
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {instructions.slice(0, 5).map((inst) => (
                <div
                  key={inst.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onSelectInstruction(inst)}
                >
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium mb-1 truncate">{inst.title}</div>
                    <Badge
                      variant={
                        inst.severity === "critical" ? "destructive" : "secondary"
                      }
                    >
                      {severityLabel(inst.severity)}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
