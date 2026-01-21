"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Building2, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export function ProductsSection() {
    return (
        <section id="systemer" className="py-24 bg-background">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                        Vårt økosystem
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground text-pretty">
                        Vi bygger spesialiserte verktøy som fungerer sømløst sammen. Velg løsningen som passer din bedrift.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                    {/* Tetrivo HMS */}
                    <Card className="relative overflow-hidden border-2 border-primary/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group bg-gradient-to-br from-card to-primary/5">
                        <div className="absolute top-0 right-0 p-3 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-bold rounded-bl-xl">
                            HOVEDSYSTEM
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                                <Shield size={28} />
                            </div>
                            <CardTitle className="text-2xl">Tetrivo HMS</CardTitle>
                            <CardDescription className="text-base">Komplett internkontrollsystem</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 relative">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                AI-drevet dokumentassistent
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Digital håndbok og instrukser
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Sikker lesebekreftelse
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Automatisk varsling til ansatte
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

                    {/* Avviksportalen */}
                    <Card className="relative overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 opacity-90">
                        <CardHeader>
                            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 text-orange-600">
                                <Building2 size={28} />
                            </div>
                            <CardTitle className="text-2xl">Avviksportalen</CardTitle>
                            <CardDescription className="text-base">Dedikert system for avvikshåndtering</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Rask innmelding av hendelser
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Saksbehandling og tiltak
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Statistikk og analyse
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                Lanseres høsten 2026
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
