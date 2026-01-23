"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Moon, Sun, Menu, LogOut, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import type { EmployeeTab } from "./EmployeeSidebar";
import type { Alert } from "@/lib/types";
import { severityColor, severityLabel } from "@/lib/ui-helpers";

interface EmployeeHeaderProps {
  activeTab: EmployeeTab;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onMenuClick: () => void;
  alerts?: Alert[];
  onOpenDeleteRequest?: () => void;
}

const tabTitles: Record<EmployeeTab, string> = {
  hjem: "Hjem",
  instrukser: "Instrukser",
  spor: "Spør Tetrivo",
};

export function EmployeeHeader({
  activeTab,
  userName,
  userEmail,
  onLogout,
  onMenuClick,
  alerts = [],
  onOpenDeleteRequest,
}: EmployeeHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = useMemo(() => {
    if (!userName) return "A";
    return userName
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase();
  }, [userName]);

  const shortName = useMemo(() => {
    if (!userName) return "";
    return userName.split(" ")[0];
  }, [userName]);

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.active),
    [alerts]
  );

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-11 w-11"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {tabTitles[activeTab]}
          </h1>
          {shortName && (
            <p className="text-sm text-muted-foreground hidden sm:block">
              Velkommen tilbake, {shortName}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-11 w-11">
              <Bell className="w-5 h-5" />
              {activeAlerts.length > 0 && (
                <span className="absolute top-2 right-2 min-w-[10px] h-[10px] rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Varsler</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {activeAlerts.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                Ingen aktive kunngjøringer.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {activeAlerts.map((alert) => {
                  const colors = severityColor(alert.severity);
                  const createdAt = new Date(alert.created_at).toLocaleDateString(
                    "nb-NO",
                    {
                      day: "numeric",
                      month: "short",
                    }
                  );
                  return (
                    <div
                      key={alert.id}
                      className="px-3 py-3 border-b border-border/60 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-3">
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
                        <span className="text-xs text-muted-foreground">
                          {createdAt}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {alert.title}
                      </p>
                      {alert.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {alert.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-11 w-11"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-11 px-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">
                {userName || "Ansatt"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{userName || "Ansatt"}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {userEmail || ""}
                </span>
              </div>
            </DropdownMenuLabel>
            {onOpenDeleteRequest && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenDeleteRequest}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Be om sletting
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logg ut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
