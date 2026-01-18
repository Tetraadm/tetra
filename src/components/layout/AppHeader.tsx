"use client"

import { Bell, Search, User, Menu, LogOut, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TetraLogo } from "@/components/tetra-logo"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface AppHeaderProps {
    onMenuClick: () => void
    user?: {
        name: string
        email?: string
        image?: string
    }
    organizationName?: string
    onLogout?: () => void
    onDisclaimer?: () => void
}

export function AppHeader({ onMenuClick, user, organizationName, onLogout, onDisclaimer }: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                        <Menu className="h-5 w-5" />
                    </Button>
                    <TetraLogo className="hidden sm:flex" />
                    {organizationName && (
                        <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium border border-border">
                            {organizationName}
                        </span>
                    )}
                </div>

                <div className="flex-1 max-w-md mx-4 hidden md:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Søk i systemet..."
                            className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onDisclaimer && (
                        <Button variant="ghost" size="sm" onClick={onDisclaimer} className="hidden md:flex">
                            <Info className="h-4 w-4 mr-2" />
                            AI-info
                        </Button>
                    )}
                    <ThemeToggle />

                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                            3
                        </Badge>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user?.image} alt={user?.name} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {user?.name?.substring(0, 2).toUpperCase() || 'BR'}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel>
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-medium">{user?.name || 'Bruker'}</p>
                                    {user?.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                Min profil
                            </DropdownMenuItem>
                            <DropdownMenuItem>Innstillinger</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={onLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logg ut
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
