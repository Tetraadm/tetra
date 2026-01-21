"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { TetraLogo } from "@/components/tetra-logo"
import { Menu, X } from "lucide-react"

const navigation = [
    { name: "Funksjoner", href: "#funksjoner" },
    { name: "Våre systemer", href: "#systemer" },
    { name: "Kontakt", href: "#kontakt" },
]

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
                <div className="flex lg:flex-1">
                    <Link href="/" className="-m-1.5 p-1.5">
                        <TetraLogo variant="full" />
                    </Link>
                </div>

                <div className="flex lg:hidden gap-2">
                    <ThemeToggle />
                    <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-md p-2.5 text-muted-foreground"
                        onClick={() => setMobileMenuOpen(true)}
                    >
                        <span className="sr-only">Åpne meny</span>
                        <Menu className="h-6 w-6" aria-hidden="true" />
                    </button>
                </div>

                <div className="hidden lg:flex lg:gap-x-8">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4 lg:items-center">
                    <ThemeToggle />
                    <Link href="/login">
                        <Button>Logg inn</Button>
                    </Link>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-background px-6 py-6 sm:max-w-sm border-l border-border">
                        <div className="flex items-center justify-between">
                            <Link href="/" className="-m-1.5 p-1.5">
                                <TetraLogo variant="full" />
                            </Link>
                            <button
                                type="button"
                                className="rounded-md p-2.5 text-muted-foreground"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <span className="sr-only">Lukk meny</span>
                                <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-border">
                                <div className="space-y-2 py-6">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                                <div className="py-6">
                                    <Link href="/login">
                                        <Button className="w-full">Logg inn</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}
