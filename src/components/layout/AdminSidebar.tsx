"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    UsersRound,
    FileText,
    Megaphone,
    MessageCircleQuestion,
    BarChart3,
    ScrollText,
    CheckSquare,
    Shield,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
};

const navItems: NavItem[] = [
    { id: "oversikt", label: "Oversikt", icon: LayoutDashboard },
    { id: "brukere", label: "Brukere", icon: Users },
    { id: "team", label: "Team", icon: UsersRound },
    { id: "instrukser", label: "Instrukser", icon: FileText },
    { id: "kunngjøringer", label: "Kunngjøringer", icon: Megaphone },
    { id: "ubesvarte", label: "Ubesvarte AI-spørsmål", icon: MessageCircleQuestion },
    { id: "innsikt", label: "Innsikt", icon: BarChart3 },
    { id: "aktivitetslogg", label: "Aktivitetslogg", icon: ScrollText },
    { id: "lesebekreftelser", label: "Lesebekreftelser", icon: CheckSquare },
    { id: "gdpr", label: "GDPR", icon: Shield },
];

interface AdminSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    collapsed: boolean;
    onCollapsedChange: (collapsed: boolean) => void;
    unansweredCount?: number;
}

export function AdminSidebar({
    activeTab,
    onTabChange,
    collapsed,
    onCollapsedChange,
    unansweredCount = 0,
}: AdminSidebarProps) {
    const items = navItems.map((item) =>
        item.id === "ubesvarte" && unansweredCount > 0
            ? { ...item, badge: unansweredCount }
            : item
    );

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
                collapsed ? "w-[72px]" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
                <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                        src="/tetrivo-logo.png"
                        alt="Tetrivo"
                        fill
                        className="object-contain"
                    />
                </div>
                {!collapsed && (
                    <span className="font-semibold text-lg text-sidebar-foreground tracking-tight">
                        Tetrivo
                    </span>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px] hover:shadow-sm hover:translate-x-0.5",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-5 h-5 flex-shrink-0",
                                    isActive ? "text-primary" : ""
                                )}
                            />
                            {!collapsed && (
                                <>
                                    <span className="flex-1 text-left truncate">
                                        {item.label}
                                    </span>
                                    {item.badge && (
                                        <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                            {collapsed && item.badge && (
                                <span className="absolute right-1 top-1 bg-primary text-primary-foreground text-[10px] font-semibold w-4 h-4 flex items-center justify-center rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Collapse Button */}
            <div className="p-3 border-t border-sidebar-border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCollapsedChange(!collapsed)}
                    className="w-full justify-center text-sidebar-foreground/70 hover:text-sidebar-foreground"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5 mr-2" />
                            <span>Minimer</span>
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
