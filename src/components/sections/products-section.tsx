"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Layers, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export function ProductsSection() {
    return (
        <section id="plattform" className="py-24 bg-background">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
                        Plattformen for trygg drift
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground text-pretty">
                        En felles plattform med utvidelser etter behov, bygget for sikkerhet, sporbarhet og enkel administrasjon.
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
                                Søkbart dokumentbibliotek
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

                    {/* Tilvalg og integrasjoner */}
                    <Card className="relative overflow-hidden border border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader>
                            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-4 text-accent">
                                <Layers size={28} />
                            </div>
                            <CardTitle className="text-2xl">Tilvalg og integrasjoner</CardTitle>
                            <CardDescription className="text-base">Utvid plattformen etter behov</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Meldinger og varsling til ansatte
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Rapporter og innsikt for ledelsen
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Integrasjoner mot HR og IT
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Tilpasset utrulling og oppsett
                            </div>
                        </CardContent>
                        <CardFooter>
                            <a href="#kontakt" className="w-full">
                                <Button variant="outline" className="w-full h-12 text-base">
                                    Ta kontakt
                                </Button>
                            </a>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </section>
    )
}
