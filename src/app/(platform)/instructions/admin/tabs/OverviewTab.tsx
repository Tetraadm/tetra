import {
  AlertTriangle,
  Users,
  FileText,
  Activity,
} from "lucide-react";
import type { Profile, Alert, Instruction } from "@/lib/types";
import { severityColor, severityLabel } from "@/lib/ui-helpers";
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
  setTab: (tab: "kunngjøringer" | "aktivitetslogg" | "innsikt") => void;
};

export default function OverviewTab({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
          Oversikt
        </h1>
        <p className="text-muted-foreground mt-1">
          Velkommen tilbake! Her er en oversikt over din organisasjon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Totalt antall brukere"
          value={users.length}
          description="I organisasjonen"
          icon={Users}
        />
        <StatCard
          title="Publiserte instrukser"
          value={publishedInstructions.length}
          description={`${draftInstructions.length} i kladd`}
          icon={FileText}
        />
        <StatCard
          title="Aktive kunngjøringer"
          value={activeAlerts.length}
          description={`${alerts.length} totalt`}
          icon={AlertTriangle}
        />
        <StatCard
          title="Ubesvarte spørsmål"
          value={unansweredCount}
          description="Venter på oppfølging"
          icon={Activity}
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
              {activeAlerts.slice(0, 3).map((alert) => {
                const severityStyles = severityColor(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border border-destructive/20"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: severityStyles.bg,
                          color: severityStyles.color,
                          borderColor: severityStyles.border,
                        }}
                      >
                        {severityLabel(alert.severity)}
                      </Badge>
                      <span className="font-medium">{alert.title}</span>
                    </div>
                  </div>
                );
              })}
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
              <CardTitle className="text-base">Aktivitetslogg</CardTitle>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setTab("aktivitetslogg")}
              >
                Se alle
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Gå til aktivitetsloggen for å se nylige hendelser i organisasjonen.
            </p>
            <Button
              variant="outline"
              onClick={() => setTab("aktivitetslogg")}
              className="w-full mt-4"
            >
              Åpne aktivitetslogg
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Innsikt</CardTitle>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setTab("innsikt")}
              >
                Se detaljer
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Se statistikk over instrukser åpnet, AI-spørsmål og mer.
            </p>
            <Button
              variant="outline"
              onClick={() => setTab("innsikt")}
              className="w-full mt-4"
            >
              Åpne innsikt
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
