"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Home, FileText, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmployeeTab } from "./EmployeeSidebar";

interface EmployeeMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: EmployeeTab;
  onTabChange: (tab: EmployeeTab) => void;
}

const navItems: { id: EmployeeTab; label: string; icon: React.ElementType }[] = [
  { id: "hjem", label: "Hjem", icon: Home },
  { id: "instrukser", label: "Instrukser", icon: FileText },
  { id: "spor", label: "Spør Tetrivo", icon: MessageCircle },
];

export function EmployeeMobileSidebar({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
}: EmployeeMobileSidebarProps) {
  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-[280px] bg-sidebar z-50 md:hidden transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9">
              <Image
                src="/tetrivo-logo.svg"
                alt="Tetrivo"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">
                Tetrivo
              </span>
              <span className="text-xs text-muted-foreground">
                HMS-plattform
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-11 w-11"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3.5 rounded-lg transition-all duration-200 text-left min-h-[52px] hover:shadow-sm hover:translate-x-0.5",
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
                <span className="font-medium">{item.label}</span>
                {item.id === "spor" && (
                  <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    AI
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
