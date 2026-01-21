"use client"

import { Bell, FileText, Lock, ShieldCheck, Sparkles, BadgeCheck } from "lucide-react"

const features = [
    {
        icon: FileText,
        name: "Dokumentstyring",
        description: "Samle prosedyrer, instrukser og versjoner i ett system med ryddige arbeidsflyter.",
    },
    {
        icon: BadgeCheck,
        name: "Lesebekreftelser",
        description: "Dokumenter hvem som har lest hva, når, og hvorfor. Alt logges for etterlevelse.",
    },
    {
        icon: ShieldCheck,
        name: "Revisjonsspor",
        description: "Få full sporbarhet med audit logg og historikk på alle kritiske hendelser.",
    },
    {
        icon: Sparkles,
        name: "AI-assistent",
        description: "Still spørsmål og få svar basert på egne rutiner, ikke generisk innhold.",
    },
    {
        icon: Lock,
        name: "Tilgangsstyring",
        description: "Styr roller, team og rettigheter uten kompromisser på datasikkerhet.",
    },
    {
        icon: Bell,
        name: "Varsling",
        description: "Automatiske varsler når nye dokumenter publiseres eller krever bekreftelse.",
    },
]

export function FeaturesSection() {
    return (
        <section id="funksjoner" className="relative py-24">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.08),transparent_55%)]" />
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-[0.45fr_0.55fr] lg:gap-16">
                    <div className="space-y-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Sikkerhet i kjernen</p>
                        <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
                            Kontroll du kan dokumentere
                        </h2>
                        <p className="text-lg text-muted-foreground text-pretty">
                            Tetrivo er bygget for virksomheter som trenger tydelige spor, klare roller og sikker drift.
                            Plattformen gjør HMS-arbeidet konsekvent, forutsigbart og revisjonsklart.
                        </p>
                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-start gap-3">
                                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                Rollebasert tilgang på tvers av organisasjonen.
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                EU-lagring og klare rutiner for personvern.
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                                Samlet kontrollpanel for ledelse og HMS-ansvarlige.
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {features.map((feature) => (
                            <div
                                key={feature.name}
                                className="group relative rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="rounded-xl border border-border/70 bg-secondary/60 p-2.5 text-primary transition-colors group-hover:bg-primary/10">
                                        <feature.icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="font-semibold text-foreground">{feature.name}</h3>
                                </div>
                                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
