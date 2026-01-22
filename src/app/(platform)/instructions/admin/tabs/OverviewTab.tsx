import {
  AlertTriangle,
  Users,
  FileText,
  File,
  CheckCircle2,
} from "lucide-react";
import type { Profile, Alert, Instruction } from "@/lib/types";
import { severityLabel } from "@/lib/ui-helpers";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Props = {
  profile: Profile;
  users: Profile[];
  instructions: Instruction[];
  alerts: Alert[];
  unansweredCount: number;
  setTab: (tab: "kunngjøringer") => void;
};

export default function OverviewTab({
  profile,
  users,
  instructions,
  alerts,
  unansweredCount,
  setTab,
}: Props) {
  const activeAlerts = alerts.filter((alert) => alert.active);
  const publishedInstructions = instructions.filter(
    (instruction) => instruction.status === "published"
  );
  const draftInstructions = instructions.filter(
    (instruction) => instruction.status === "draft"
  );

  const recentActivity = [
    {
      action: "Ny bruker registrert",
      user: profile.full_name || "Administrator",
      time: "2 min siden",
    },
    {
      action: "Instruks oppdatert",
      user: "HMS-team",
      time: "15 min siden",
    },
    {
      action: "Kunngjøring publisert",
      user: profile.full_name || "Administrator",
      time: "1 time siden",
    },
    {
      action: "Nye lesebekreftelser",
      user: "Organisasjon",
      time: "2 timer siden",
    },
  ];

  const completionRate = instructions.length
    ? Math.min(
        100,
        Math.round((publishedInstructions.length / instructions.length) * 100)
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          Oversikt
        </h1>
        <p className="text-muted-foreground mt-1">
          Velkommen tilbake! Her er en oversikt over din HMS-status.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Totalt antall brukere"
          value={users.length}
          trend={{ value: 12, isPositive: true }}
          description="Siste 30 dager"
          icon={Users}
        />
        <StatCard
          title="Aktive instrukser"
          value={publishedInstructions.length}
          trend={{ value: 8, isPositive: true }}
          description="Totalt dokumenter"
          icon={FileText}
        />
        <StatCard
          title="Fullførte kurs"
          value={`${completionRate}%`}
          trend={{ value: 3, isPositive: true }}
          description="Gjennomføringsrate"
          icon={CheckCircle2}
        />
        <StatCard
          title="Ubesvarte spørsmål"
          value={unansweredCount}
          trend={{ value: 2, isPositive: false }}
          description="Venter på svar"
          icon={AlertTriangle}
        />
      </div>

      {activeAlerts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Krever oppmerksomhet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-destructive/20"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        alert.severity === "critical"
                          ? "border-destructive text-destructive"
                          : "border-[var(--warning-border)] text-[var(--warning)]"
                      }
                    >
                      {severityLabel(alert.severity)}
                    </Badge>
                    <span className="font-medium">{alert.title}</span>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setTab("kunngjøringer")}
                className="w-full mt-2 border-destructive/30 hover:bg-destructive/10 text-destructive"
              >
                Se alle kunngjøringer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Nylig aktivitet</CardTitle>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
              >
                Se alle
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((item, index) => (
              <div
                key={`${item.action}-${index}`}
                className="flex items-center gap-3 py-2 border-b border-border last:border-0"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.action}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.user}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">HMS-status</CardTitle>
              <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full font-medium">
                God
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Lesebekreftelser", value: 87, color: "bg-primary" },
              { label: "Kurs fullført", value: 94, color: "bg-chart-2" },
              { label: "Dokumenter oppdatert", value: 100, color: "bg-chart-4" },
              { label: "GDPR-samsvar", value: 100, color: "bg-chart-3" },
            ].map((item) => (
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Oppdatert for siste 30 dager
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

