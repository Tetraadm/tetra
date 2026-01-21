"use client"

import { Sparkles, FileText, Zap, Bell, Lock, Shield } from "lucide-react"

const features = [
    {
        icon: Sparkles,
        name: "AI-assistent",
        description: "Still spørsmål om HMS-regler, prosedyrer og instrukser. Få svar basert på bedriftens egen dokumentasjon.",
    },
    {
        icon: FileText,
        name: "Digital håndbok",
        description: "Alle dokumenter, instrukser og retningslinjer samlet på ett sted – med full versjonskontroll.",
    },
    {
        icon: Zap,
        name: "Lesebekreftelse",
        description: "Sørg for at de ansatte har lest og forstått viktige dokumenter, med signeringslogg.",
    },
    {
        icon: Bell,
        name: "Varsling",
        description: "Hold alle oppdatert med automatiske varsler når nye dokumenter publiseres.",
    },
    {
        icon: Lock,
        name: "Tilgangsstyring",
        description: "Kontroller hvem som kan se og redigere dokumenter, med rollebaserte tilganger.",
    },
    {
        icon: Shield,
        name: "Sikker lagring",
        description: "All data lagres trygt i EU (Sverige), i samsvar med GDPR.",
    },
]

export function FeaturesSection() {
    return (
        <section id="funksjoner" className="py-24 bg-muted/30">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center mb-16">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">
                        Alt du trenger for HMS-arbeidet
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground text-pretty">
                        Kraftige funksjoner som gjør internkontroll enklere og mer effektivt
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.name} className="relative p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="rounded-lg p-2.5 bg-primary/10">
                                    <feature.icon className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="font-semibold text-foreground">{feature.name}</h3>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
