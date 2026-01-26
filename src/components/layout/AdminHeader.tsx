"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Building2,
  Menu,
  FileText,
  Users,
  Megaphone,
  FolderOpen,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

export type SearchResult = {
  id: string;
  title: string;
  type: "instruction" | "user" | "alert" | "team";
  tab: string;
};

interface AdminHeaderProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
  sidebarCollapsed?: boolean;
  onMenuClick?: () => void;
  organizationName?: string;
  organizationNumber?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchResults?: SearchResult[];
  onSearchResultClick?: (result: SearchResult) => void;
  onOpenProfile?: () => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  notificationCount?: number;
}

export function AdminHeader({
  userName,
  userEmail,
  onLogout,
  sidebarCollapsed = false,
  onMenuClick,
  organizationName,
  organizationNumber,
  searchQuery = "",
  onSearchChange,
  searchResults = [],
  onSearchResultClick,
  onOpenProfile,
  onOpenSettings,
  onOpenNotifications,
  notificationCount = 0,
}: AdminHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show dropdown when there's a query and results
  useEffect(() => {
    if (searchQuery.trim().length > 0 && searchResults.length > 0) {
      setShowSearchDropdown(true);
    } else {
      setShowSearchDropdown(false);
    }
  }, [searchQuery, searchResults]);

  const handleResultClick = useCallback((result: SearchResult) => {
    onSearchResultClick?.(result);
    setShowSearchDropdown(false);
    onSearchChange?.("");
  }, [onSearchResultClick, onSearchChange]);

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "instruction":
        return <FileText className="w-4 h-4" />;
      case "user":
        return <Users className="w-4 h-4" />;
      case "alert":
        return <Megaphone className="w-4 h-4" />;
      case "team":
        return <FolderOpen className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "instruction":
        return "Instruks";
      case "user":
        return "Bruker";
      case "alert":
        return "Kunngjøring";
      case "team":
        return "Team";
    }
  };

  const initials = useMemo(() => {
    if (!userName) return "A";
    return userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  }, [userName]);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-card/80 backdrop-blur-xl border-b border-border transition-all duration-300",
        sidebarCollapsed ? "left-[72px]" : "left-64",
        "max-md:left-0"
      )}
    >
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>

        <div className="hidden md:flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-foreground">
              {organizationName || "Organisasjon"}
            </h2>
            {organizationNumber && (
              <p className="text-xs text-muted-foreground">
                Organisasjonsnummer: {organizationNumber}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block" ref={searchRef}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 w-64">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Søk..."
                value={searchQuery}
                onChange={(event) => onSearchChange?.(event.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length > 0 && searchResults.length > 0) {
                    setShowSearchDropdown(true);
                  }
                }}
                className="bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground flex-1"
              />
              <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Ctrl K
              </kbd>
            </div>

            {/* Search Results Dropdown */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                <div className="p-2 text-xs text-muted-foreground border-b border-border">
                  {searchResults.length} resultat{searchResults.length !== 1 ? "er" : ""}
                </div>
                {searchResults.slice(0, 10).map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className="text-muted-foreground">
                      {getResultIcon(result.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(result.type)}
                      </p>
                    </div>
                  </button>
                ))}
                {searchResults.length > 10 && (
                  <div className="p-2 text-xs text-muted-foreground text-center border-t border-border">
                    +{searchResults.length - 10} flere resultater
                  </div>
                )}
              </div>
            )}
          </div>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
            onClick={onOpenNotifications}
            disabled={!onOpenNotifications}
            aria-label="Kunngjøringer"
          >
            <Bell className="w-5 h-5" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 pl-2 pr-3 h-10"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground">
                    {userName || "Administrator"}
                  </p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{userName || "Administrator"}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {userEmail || ""}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenProfile}>
                <User className="w-4 h-4 mr-2" />
                Profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="w-4 h-4 mr-2" />
                Innstillinger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logg ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
