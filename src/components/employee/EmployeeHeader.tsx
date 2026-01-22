"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Moon, Sun, Menu, LogOut } from "lucide-react";
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
import type { EmployeeTab } from "./EmployeeSidebar";

interface EmployeeHeaderProps {
  activeTab: EmployeeTab;
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  onMenuClick: () => void;
}

const tabTitles: Record<EmployeeTab, string> = {
  hjem: "Hjem",
  instrukser: "Instrukser",
  spor: "Spor Tetrivo",
};

export function EmployeeHeader({
  activeTab,
  userName,
  userEmail,
  onLogout,
  onMenuClick,
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
        <Button variant="ghost" size="icon" className="relative h-11 w-11">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </Button>

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
            <DropdownMenuSeparator />
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
