"use client";

import { Plus, Megaphone, MoreHorizontal, Pin } from "lucide-react";
import type { Alert } from "@/lib/types";
import { severityLabel, severityColor } from "@/lib/ui-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  alerts: Alert[];
  toggleAlert: (alertId: string, active: boolean) => void;
  deleteAlert: (alertId: string) => void;
  setShowCreateAlert: (show: boolean) => void;
  alertsHasMore: boolean;
  alertsLoadingMore: boolean;
  loadMoreAlerts: () => void;
};

export default function AlertsTab({
  alerts,
  toggleAlert,
  deleteAlert,
  setShowCreateAlert,
  alertsHasMore,
  alertsLoadingMore,
  loadMoreAlerts,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Kunngjøringer
          </h1>
          <p className="text-muted-foreground mt-1">
            Viktige meldinger og oppdateringer
          </p>
        </div>
        <Button className="min-h-[44px]" onClick={() => setShowCreateAlert(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Ny kunngjøring
        </Button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => {
          const colors = severityColor(alert.severity);
          const createdAt = new Date(alert.created_at).toLocaleDateString("nb-NO", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <div
              key={alert.id}
              className="bg-card rounded-xl border border-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Megaphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {alert.title}
                      </h3>
                      {!alert.active && (
                        <Pin className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                    {alert.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {alert.description}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleAlert(alert.id, alert.active)}>
                      {alert.active ? "Deaktiver" : "Aktiver"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => deleteAlert(alert.id)}>
                      Slett
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.color,
                      borderColor: colors.border,
                    }}
                  >
                    {severityLabel(alert.severity)}
                  </Badge>
                  {!alert.active && <span>Inaktiv</span>}
                </div>
                <span className="text-xs text-muted-foreground">{createdAt}</span>
              </div>
            </div>
          );
        })}
      </div>

      {alertsHasMore && (
        <Card>
          <CardContent className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={loadMoreAlerts}
              disabled={alertsLoadingMore}
            >
              {alertsLoadingMore ? "Laster..." : "Vis flere"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
