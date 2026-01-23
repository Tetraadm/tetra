import {
  BarChart3,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Shield,
  LogIn,
  Eye,
  UserPlus,
  Settings,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import type { AuditLogRow } from "../hooks/useAuditLogs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Translate action types to Norwegian
 */
function formatActionType(actionType: string): string {
  const normalized = actionType.replace(/\./g, "_");
  const translations: Record<string, string> = {
    instruction_publish: "Publisert instruks",
    instruction_create: "Opprettet instruks",
    instruction_update: "Oppdatert instruks",
    instruction_delete: "Slettet instruks",
    team_create: "Opprettet team",
    team_delete: "Slettet team",
    create_instruction: "Opprettet instruks",
    update_instruction: "Oppdatert instruks",
    publish_instruction: "Publisert instruks",
    unpublish_instruction: "Avpublisert instruks",
    delete_instruction: "Slettet instruks",
    create_alert: "Opprettet kunngjøring",
    toggle_alert: "Oppdatert kunngjøring",
    delete_alert: "Slettet kunngjøring",
    create_folder: "Opprettet mappe",
    delete_folder: "Slettet mappe",
    create_team: "Opprettet team",
    delete_team: "Slettet team",
    create_user: "Opprettet bruker",
    edit_user: "Redigert bruker",
    delete_user: "Slettet bruker",
    invite_user: "Invitert bruker",
    change_role: "Endret rolle",
  };

  if (translations[normalized]) return translations[normalized];
  if (translations[actionType]) return translations[actionType];

  const cleaned = normalized.replace(/_/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Export audit logs to CSV file
 */
function exportAuditLogsCSV(auditLogs: AuditLogRow[]): void {
  const headers = ["Tidspunkt", "Bruker", "Handling", "Entitet", "Detaljer"];
  const rows = auditLogs.map((log) => [
    new Date(log.created_at).toLocaleString("nb-NO"),
    log.profiles?.full_name || "Ukjent",
    formatActionType(log.action_type),
    log.entity_type,
    JSON.stringify(log.details),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
}

function getLogVisual(actionType: string) {
  const normalized = actionType.replace(/\./g, "_");
  if (normalized.includes("login")) {
    return { Icon: LogIn, color: "text-chart-2", bg: "bg-chart-2/10" };
  }
  if (normalized.includes("view")) {
    return { Icon: Eye, color: "text-primary", bg: "bg-primary/10" };
  }
  if (normalized.includes("invite") || normalized.includes("create_user")) {
    return { Icon: UserPlus, color: "text-chart-4", bg: "bg-chart-4/10" };
  }
  if (normalized.includes("instruction")) {
    return { Icon: FileText, color: "text-chart-3", bg: "bg-chart-3/10" };
  }
  if (normalized.includes("role")) {
    return { Icon: Shield, color: "text-chart-5", bg: "bg-chart-5/10" };
  }
  return { Icon: Settings, color: "text-muted-foreground", bg: "bg-muted" };
}

function getLogSubject(log: AuditLogRow): string | null {
  if (!log.details || typeof log.details !== "object") return null;
  const details = log.details as Record<string, unknown>;
  const candidates = [
    details.instruction_title,
    details.alert_title,
    details.folder_name,
    details.team_name,
    details.user_name,
    details.title,
    details.name,
  ];

  const subject = candidates.find((value) => typeof value === "string") as
    | string
    | undefined;

  return subject || null;
}

type AuditFilter = {
  actionType: string;
  startDate: string;
  endDate: string;
};

type Props = {
  auditLogs: AuditLogRow[];
  auditLogsLoading: boolean;
  auditFilter: AuditFilter;
  setAuditFilter: (filter: AuditFilter) => void;
  loadAuditLogs: () => void;
  auditTotal: number;
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
};

export default function AuditLogTab({
  auditLogs,
  auditLogsLoading,
  auditFilter,
  setAuditFilter,
  loadAuditLogs,
  auditTotal,
  currentPage,
  totalPages,
  goToPage,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Aktivitetslogg
          </h1>
          <p className="text-muted-foreground mt-1">
            Oversikt over all aktivitet i systemet
          </p>
        </div>
        <Button
          variant="outline"
          className="min-h-[44px] bg-transparent"
          onClick={() => exportAuditLogsCSV(auditLogs)}
        >
          <Download className="w-4 h-4 mr-2" />
          Eksporter CSV
        </Button>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrer aktivitetslogg</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Handlingstype</Label>
              <Select
                value={auditFilter.actionType}
                onValueChange={(value) =>
                  setAuditFilter({ ...auditFilter, actionType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle handlinger</SelectItem>
                  <SelectItem value="create_instruction">
                    Opprett instruks
                  </SelectItem>
                  <SelectItem value="publish_instruction">
                    Publiser instruks
                  </SelectItem>
                  <SelectItem value="unpublish_instruction">
                    Avpubliser instruks
                  </SelectItem>
                  <SelectItem value="delete_instruction">
                    Slett instruks
                  </SelectItem>
                  <SelectItem value="create_user">Opprett bruker</SelectItem>
                  <SelectItem value="edit_user">Rediger bruker</SelectItem>
                  <SelectItem value="delete_user">Slett bruker</SelectItem>
                  <SelectItem value="invite_user">Inviter bruker</SelectItem>
                  <SelectItem value="change_role">Endre rolle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fra dato</Label>
              <Input
                type="date"
                value={auditFilter.startDate}
                onChange={(e) =>
                  setAuditFilter({ ...auditFilter, startDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Til dato</Label>
              <Input
                type="date"
                value={auditFilter.endDate}
                onChange={(e) =>
                  setAuditFilter({ ...auditFilter, endDate: e.target.value })
                }
              />
            </div>
            <Button
              onClick={loadAuditLogs}
              disabled={auditLogsLoading}
              className="w-full"
            >
              {auditLogsLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Laster...
                </>
              ) : (
                "Filtrer"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Aktivitetslogg ({auditTotal} hendelser)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditLogsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : auditLogs.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="w-12 h-12" />}
              title="Ingen aktivitet funnet"
              description="Prøv å endre filtrene eller kom tilbake senere."
              actionLabel="Nullstill filter"
              onAction={() => {
                setAuditFilter({
                  actionType: "all",
                  startDate: "",
                  endDate: "",
                });
                loadAuditLogs();
              }}
            />
          ) : (
            <div className="divide-y divide-border">
              {auditLogs.map((log) => {
                const { Icon, color, bg } = getLogVisual(log.action_type);
                const subject = getLogSubject(log);
                const actor = log.profiles?.full_name || "System";
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {formatActionType(log.action_type)}
                        </span>
                        {subject && (
                          <span className="text-sm text-muted-foreground truncate">
                            • {subject}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{actor}</span>
                        <span aria-hidden="true">•</span>
                        <span>
                          {new Date(log.created_at).toLocaleString("no-NO", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Forrige
              </Button>
              <span className="text-sm text-muted-foreground font-mono">
                Side {currentPage + 1} av {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Neste
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
