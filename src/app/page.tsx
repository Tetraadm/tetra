'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Shield, Building2, Mail, Phone, ArrowRight } from 'lucide-react'

import { TetraLogo } from '@/components/tetra-logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <TetraLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#systemer" className="hover:text-foreground transition-colors">Våre Systemer</a>
            <a href="#priser" className="hover:text-foreground transition-colors">Priser</a>
            <a href="#kontakt" className="hover:text-foreground transition-colors">Kontakt</a>
          </nav>
          <Link href="/login">
            <Button>Logg inn</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 text-center container mx-auto px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Nyhet: AI-drevet HMS-assistent
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Fremtidens plattform for <br /> trygghet på arbeidsplassen
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Tetra samler HMS, avvikshåndtering og dokumentasjon på ett sted.
            Enkelt for ansatte, oversiktlig for ledere.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all">
                Kom i gang med Tetra HMS
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Se demo
            </Button>
          </div>
        </section>

        {/* Portfolio / Systems Grid */}
        <section id="systemer" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Vårt Økosystem</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Vi bygger spesialiserte verktøy som snakker sammen. Velg systemet du trenger.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Tetra HMS Card */}
              <Card className="relative overflow-hidden border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all">
                <div className="absolute top-0 right-0 p-3 bg-primary text-primary-foreground text-xs font-bold rounded-bl-xl">
                  HOVEDSYSTEM
                </div>
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                    <Shield size={24} />
                  </div>
                  <CardTitle className="text-2xl">Tetra HMS</CardTitle>
                  <CardDescription>Komplett internkontroll</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Feature text="AI-drevet dokumentassistent" />
                  <Feature text="Digital håndbok & instrukser" />
                  <Feature text="Sikker lesebekreftelse" />
                  <Feature text="Varsling til ansatte" />
                </CardContent>
                <CardFooter>
                  <Link href="/login" className="w-full">
                    <Button className="w-full h-11">Gå til Tetra HMS</Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Avvikssystem Placeholder */}
              <Card className="border shadow-md hover:shadow-lg transition-all opacity-90">
                <CardHeader>
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 text-orange-600">
                    <Building2 size={24} />
                  </div>
                  <CardTitle className="text-2xl">Avviksportalen</CardTitle>
                  <CardDescription>Dedikert avvikshåndtering</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Feature text="Rask innmelding av hendelser" />
                  <Feature text="Saksbehandling & tiltak" />
                  <Feature text="Statistikk & analyse" />
                  <Feature text="Kommer høsten 2026" />
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full h-11" disabled>
                    Lanseres snart
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="priser" className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">Enkel Prismodell</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Starter */}
              <PricingCard
                title="Start"
                price="0,-"
                description="For små bedrifter opp til 5 ansatte"
                features={['AI-assistent (Begrenset)', 'Standard håndbok', 'E-post support']}
              />
              {/* Pro */}
              <PricingCard
                title="Pro"
                price="490,-"
                period="/mnd"
                isPopular
                description="For vekstbedrifter som trenger full kontroll"
                features={['Ubegrenset AI-søk', 'Egendefinerte instrukser', 'SMS-varsling', 'Prioritert support', 'Audit logger']}
              />
              {/* Enterprise */}
              <PricingCard
                title="Enterprise"
                price="Ta kontakt"
                description="For større organisasjoner med spesielle behov"
                features={['SLA-avtale', 'Egen server/tenant', 'SSO integrasjon', 'Tilpasset opplæring']}
              />
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="kontakt" className="py-20 bg-muted/30 border-t">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-3xl font-bold mb-8">Har du spørsmål?</h2>
            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div className="flex flex-col items-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <Mail size={20} />
                </div>
                <h3 className="font-semibold mb-2">E-post</h3>
                <p className="text-muted-foreground text-sm">kontakt@tetrivo.com</p>
                <p className="text-muted-foreground text-sm">support@tetrivo.com</p>
              </div>
              <div className="flex flex-col items-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <Phone size={20} />
                </div>
                <h3 className="font-semibold mb-2">Telefon</h3>
                <p className="text-muted-foreground text-sm">+47 123 45 678</p>
                <p className="text-muted-foreground text-sm">Hverdager 08-16</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-background">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-muted-foreground text-sm">
          <p>© 2026 Tetra - En del av Antigravity</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-foreground">Personvern</a>
            <a href="#" className="hover:text-foreground">Vilkår</a>
            <a href="#" className="hover:text-foreground">Status</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <CheckCircle size={16} className="text-green-500 shrink-0" />
      <span>{text}</span>
    </div>
  )
}

function PricingCard({ title, price, period, description, features, isPopular }: {
  title: string
  price: string
  period?: string
  description: string
  features: string[]
  isPopular?: boolean
}) {
  return (
    <Card className={`relative flex flex-col ${isPopular ? 'border-primary shadow-xl scale-105 z-10' : 'shadow-md'}`}>
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
          MEST POPULÆR
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="mt-4 mb-2">
          <span className="text-4xl font-bold">{price}</span>
          {period && <span className="text-muted-foreground">{period}</span>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {features.map((f: string, i: number) => (
          <Feature key={i} text={f} />
        ))}
      </CardContent>
      <CardFooter>
        <Button variant={isPopular ? 'default' : 'outline'} className="w-full">
          Velg plan
        </Button>
      </CardFooter>
    </Card>
  )
}