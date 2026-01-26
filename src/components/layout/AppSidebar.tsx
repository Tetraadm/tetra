"use client"

import { cn } from "@/lib/utils"
import { LucideIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TetrivoLogo } from "@/components/tetrivo-logo"

export interface SidebarTab {
    id: string
    label: string
    icon: LucideIcon
    badge?: number
    badgeColor?: "destructive" | "warning" | "default"
}

interface AppSidebarProps {
    tabs: SidebarTab[]
    activeTab: string
    onTabChange: (tab: string) => void
    open: boolean
    onClose: () => void
}

export function AppSidebar({ tabs, activeTab, onTabChange, open, onClose }: AppSidebarProps) {
    return (
        <>
            {/* Mobile overlay */}
            {open && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onClose} />}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 h-full w-72 bg-card/90 border-r border-border/70 backdrop-blur-lg transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
                    open ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex h-16 items-center justify-between px-4 border-b border-border lg:hidden">
                    <TetrivoLogo size={48} />
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-4rem)] lg:h-full">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.3em] px-3 mb-4">Navigasjon</p>
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
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "")} />
                                {tab.label}
                                {tab.badge !== undefined && (
                                    <span
                                        className={cn(
                                            "ml-auto text-xs font-semibold px-2 py-0.5 rounded-full",
                                            isActive
                                                ? "bg-primary-foreground/20 text-primary-foreground"
                                                : tab.badgeColor === 'destructive'
                                                    ? "bg-destructive text-destructive-foreground"
                                                    : tab.badgeColor === 'warning'
                                                        ? "bg-warning/20 text-warning"
                                                        : "bg-secondary text-foreground"
                                        )}
                                    >
                                        {tab.badge}
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
