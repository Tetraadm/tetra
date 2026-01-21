"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, Shield, Users } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    {/* Badge */}
                    <div className="mb-8 inline-flex items-center rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground">
                        <span className="mr-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                        Nyhet: AI-drevet HMS-assistent
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl text-balance">
                        Fremtidens plattform for trygghet på arbeidsplassen
                    </h1>

                    {/* Subheadline */}
                    <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto text-pretty">
                        Tetrivo samler HMS-arbeid, avvikshåndtering og dokumentasjon på ett sted.
                        <span className="text-foreground font-medium"> Enkelt for de ansatte, oversiktlig for lederne.</span>
                    </p>

                    {/* CTAs */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link href="/login">
                            <Button size="lg" className="w-full sm:w-auto px-8">
                                Kom i gang gratis
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                        <a href="#kontakt">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 bg-transparent">
                                Ta kontakt
                            </Button>
                        </a>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-16">
                        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <span>Ingen kredittkort påkrevd</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <span>GDPR-kompatibel</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-accent" />
                                <span>Brukes av norske bedrifter</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
