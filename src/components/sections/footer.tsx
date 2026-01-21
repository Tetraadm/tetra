"use client"

import { TetraLogo } from "@/components/tetra-logo"

export function Footer() {
    return (
        <footer className="py-12 border-t bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <TetraLogo />
                        <div className="h-6 w-px bg-border" />
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Tetrivo Systems
                        </p>
                    </div>
                    <div className="flex gap-8 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Personvern</a>
                        <a href="#" className="hover:text-foreground transition-colors">Vilkår</a>
                        <a href="#" className="hover:text-foreground transition-colors">Status</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}
