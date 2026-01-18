"use client"

import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  UsersRound,
  FileText,
  FolderOpen,
  Bell,
  CheckSquare,
  Activity,
  Bot,
  HelpCircle,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { TetraLogo } from "@/components/tetra-logo"

const tabs = [
  { id: "oversikt", label: "Oversikt", icon: LayoutDashboard },
  { id: "brukere", label: "Brukere", icon: Users },
  { id: "team", label: "Team", icon: UsersRound },
  { id: "instrukser", label: "Instrukser", icon: FileText },
  { id: "mapper", label: "Mapper", icon: FolderOpen },
  { id: "varsler", label: "Varsler", icon: Bell },
  { id: "lesebekreftelser", label: "Lesebekreftelser", icon: CheckSquare },
  { id: "aktivitetslogg", label: "Aktivitetslogg", icon: Activity },
  { id: "ai-logg", label: "AI-logg", icon: Bot },
  { id: "ubesvarte", label: "Ubesvarte spørsmål", icon: HelpCircle },
]

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  open: boolean
  onClose: () => void
}

export function Sidebar({ activeTab, onTabChange, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-72 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border lg:hidden">
          <TetraLogo />
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-4rem)] lg:h-full">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4">Navigasjon</p>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                  onClose()
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "")} />
                {tab.label}
                {tab.id === "varsler" && (
                  <span
                    className={cn(
                      "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-destructive text-destructive-foreground",
                    )}
                  >
                    5
                  </span>
                )}
                {tab.id === "ubesvarte" && (
                  <span
                    className={cn(
                      "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-tetra-warning text-foreground",
                    )}
                  >
                    12
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
