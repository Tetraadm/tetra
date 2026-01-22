"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Home,
  FileText,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type EmployeeTab = "hjem" | "instrukser" | "spor";

interface EmployeeSidebarProps {
  activeTab: EmployeeTab;
  onTabChange: (tab: EmployeeTab) => void;
}

const navItems: { id: EmployeeTab; label: string; icon: React.ElementType }[] = [
  { id: "hjem", label: "Hjem", icon: Home },
  { id: "instrukser", label: "Instrukser", icon: FileText },
  { id: "spor", label: "Spor Tetrivo", icon: MessageCircle },
];

export function EmployeeSidebar({
  activeTab,
  onTabChange,
}: EmployeeSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-9 h-9 flex-shrink-0">
            <Image
              src="/tetrivo-logo.png"
              alt="Tetrivo"
              fill
              className="object-contain"
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sidebar-foreground truncate">
                Tetrivo
              </span>
              <span className="text-xs text-muted-foreground truncate">
                HMS-plattform
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-left min-h-[48px] hover:shadow-sm hover:translate-x-0.5",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive && "text-primary"
                )}
              />
              {!collapsed && (
                <span className="font-medium truncate">{item.label}</span>
              )}
              {item.id === "spor" && !collapsed && (
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  AI
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 mr-2" />
              <span>Skjul meny</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
