"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Megaphone, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export function ProductsSection() {
    return (
        <section id="systemer" className="py-24 bg-background">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
                        Systemer for trygg drift
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground text-pretty">
                        Velg moduler som matcher behovene deres. Alt er designet for sikkerhet, sporbarhet og enkel administrasjon.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                    {/* Tetrivo HMS */}
                    <Card className="relative overflow-hidden border-2 border-primary/30 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group bg-gradient-to-br from-card to-primary/10">
                        <div className="absolute top-4 right-4 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                            Kjernesystem
                        </div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.18),transparent_55%)] opacity-0 transition-opacity group-hover:opacity-100" />
                        <CardHeader className="relative">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform">
                                <Shield size={28} />
                            </div>
                            <CardTitle className="text-2xl">Tetrivo HMS</CardTitle>
                            <CardDescription className="text-base">Hovedplattform for sikker HMS-styring</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 relative">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Revisjonsspor og lesebekreftelser
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                AI-assistent for interne rutiner
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Rollebasert tilgang og kontrollpanel
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Sikker dokumentflyt i EU
                            </div>
                        </CardContent>
                        <CardFooter className="relative">
                            <Link href="/login" className="w-full">
                                <Button className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all">
                                    Gå til Tetrivo HMS
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>

                    {/* Kunngjøringer */}
                    <Card className="relative overflow-hidden border border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader>
                            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 text-accent">
                                <Megaphone size={28} />
                            </div>
                            <CardTitle className="text-2xl">Kunngjøringer</CardTitle>
                            <CardDescription className="text-base">Meldinger som vises direkte i appen</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Send meldinger til alle ansatte eller utvalgte team
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Prioritet og synlighet styres fra administrator
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Tydelig visning på ansattes startside
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Tilgjengelig som tilleggstjeneste
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full h-12 text-base" disabled>
                                Kommer snart
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>
    )
}
