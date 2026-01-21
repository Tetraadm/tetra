"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, BadgeCheck, FileText, Lock, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
    return (
        <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,var(--border)_50%,transparent_100%)] opacity-60" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.12),transparent_55%)]" />
                <div className="absolute -top-36 right-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(14,116,144,0.18),transparent_70%)] blur-3xl animate-glow motion-reduce:animate-none" />
                <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14),transparent_70%)] blur-3xl animate-glow motion-reduce:animate-none" />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm animate-fade-up motion-reduce:animate-none">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            Sikker HMS-plattform
                        </div>

                        <div className="space-y-6">
                            <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance animate-fade-up-delay motion-reduce:animate-none">
                                Sikker HMS-styring med dokumentert kontroll
                            </h1>
                            <p className="text-lg leading-8 text-muted-foreground max-w-xl text-pretty animate-fade-up-delay-2 motion-reduce:animate-none">
                                Tetrivo samler internkontroll, dokumenter og lesebekreftelser i ett system.
                                Du får tydelig sporbarhet, ryddig tilgangsstyring og trygg drift for hele organisasjonen.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up-delay-3 motion-reduce:animate-none">
                            <Link href="/login">
                                <Button size="lg" className="w-full sm:w-auto px-8">
                                    Kom i gang
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <a href="#systemer" className="w-full sm:w-auto">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                                    Se plattformen
                                </Button>
                            </a>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                GDPR-tilpasset
                            </div>
                            <div className="flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" />
                                Rollebasert tilgang
                            </div>
                            <div className="flex items-center gap-2">
                                <BadgeCheck className="h-5 w-5 text-primary" />
                                Revisjonsspor i sanntid
                            </div>
                        </div>
                    </div>

                    <div className="relative animate-fade-up-delay-2 motion-reduce:animate-none">
                        <div className="absolute -top-6 right-6 hidden rounded-2xl border border-border/80 bg-card/80 px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground shadow-sm lg:flex motion-reduce:animate-none">
                            Kontrollpanel
                        </div>
                        <div className="relative rounded-3xl border border-border/80 bg-card/80 p-8 shadow-lg backdrop-blur-lg">
                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                <span>Sikkerhetsoversikt</span>
                                <span className="flex items-center gap-2 text-[11px] font-semibold text-primary">
                                    <span className="h-2 w-2 rounded-full bg-primary" />
                                    Aktiv
                                </span>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Rollebasert tilgang</p>
                                            <p className="text-xs text-muted-foreground">Rettigheter per team og rolle</p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Kontrollert</span>
                                </div>

                                <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-accent/10 p-2 text-accent">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Lesebekreftelser</p>
                                            <p className="text-xs text-muted-foreground">Dokumentert etterlevelse</p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">Sporbart</span>
                                </div>

                                <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-background/70 p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">AI-assistent</p>
                                            <p className="text-xs text-muted-foreground">Svar basert på egne rutiner</p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Trygt</span>
                                </div>
                            </div>

                            <div className="mt-6 rounded-2xl border border-border/70 bg-secondary/60 px-4 py-3">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Databehandling</span>
                                    <span className="font-semibold text-foreground">EU-lagring (Sverige)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
