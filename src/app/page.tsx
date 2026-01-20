'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Shield, Building2, Mail, MapPin, ArrowRight, Sparkles, Zap, Users, Send, FileText, Bell, Lock } from 'lucide-react'

import { TetraLogo } from '@/components/tetra-logo'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Navigasjon */}
      <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <TetraLogo />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#funksjoner" className="hover:text-foreground transition-colors">Funksjoner</a>
            <a href="#systemer" className="hover:text-foreground transition-colors">Våre systemer</a>
            <a href="#kontakt" className="hover:text-foreground transition-colors">Kontakt</a>
          </nav>
          <Link href="/login">
            <Button className="shadow-lg hover:shadow-xl transition-all">Logg inn</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero-seksjon */}
        <section className="relative py-24 md:py-40 overflow-hidden">
          {/* Animert gradientbakgrunn */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

          {/* Dekorative elementer */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              {/* Merkelapp */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-8 border border-primary/20 shadow-lg shadow-primary/5">
                <Sparkles className="h-4 w-4" />
                <span>Nyhet: AI-drevet HMS-assistent</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
              </div>

              {/* Hovedoverskrift */}
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-muted-foreground">
                  Fremtidens plattform for
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary">
                  trygghet på arbeidsplassen
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed">
                Tetrivo samler HMS-arbeid, avvikshåndtering og dokumentasjon på ett sted.
                <span className="text-foreground font-medium"> Enkelt for de ansatte, oversiktlig for lederne.</span>
              </p>

              {/* Handlingsknapper */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-primary to-accent">
                    Kom i gang gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#kontakt">
                  <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-2 hover:bg-muted/50">
                    Ta kontakt
                  </Button>
                </a>
              </div>

              {/* Tillitsmerker */}
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
        </section>

        {/* Funksjoner-seksjon */}
        <section id="funksjoner" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Alt du trenger for HMS-arbeidet</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Kraftige funksjoner som gjør internkontroll enklere og mer effektivt
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard
                icon={<Sparkles className="h-8 w-8" />}
                title="AI-assistent"
                description="Still spørsmål om HMS-regler, prosedyrer og instrukser. Få svar basert på bedriftens egen dokumentasjon."
              />
              <FeatureCard
                icon={<FileText className="h-8 w-8" />}
                title="Digital håndbok"
                description="Alle dokumenter, instrukser og retningslinjer samlet på ett sted – med full versjonskontroll."
              />
              <FeatureCard
                icon={<Zap className="h-8 w-8" />}
                title="Lesebekreftelse"
                description="Sørg for at de ansatte har lest og forstått viktige dokumenter, med signeringslogg."
              />
            </div>

            {/* Ekstra funksjonsrad */}
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-8">
              <FeatureCard
                icon={<Bell className="h-8 w-8" />}
                title="Varsling"
                description="Hold alle oppdatert med automatiske varsler når nye dokumenter publiseres."
              />
              <FeatureCard
                icon={<Lock className="h-8 w-8" />}
                title="Tilgangsstyring"
                description="Kontroller hvem som kan se og redigere dokumenter, med rollebaserte tilganger."
              />
              <FeatureCard
                icon={<Shield className="h-8 w-8" />}
                title="Sikker lagring"
                description="All data lagres trygt i EU (Sverige), i samsvar med GDPR."
              />
            </div>
          </div>
        </section>

        {/* Våre systemer */}
        <section id="systemer" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Vårt økosystem</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Vi bygger spesialiserte verktøy som fungerer sømløst sammen. Velg løsningen som passer din bedrift.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Tetrivo HMS-kort */}
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
                  <Feature text="AI-drevet dokumentassistent" />
                  <Feature text="Digital håndbok og instrukser" />
                  <Feature text="Sikker lesebekreftelse" />
                  <Feature text="Automatisk varsling til ansatte" />
                </CardContent>
                <CardFooter className="relative">
                  <Link href="/login" className="w-full">
                    <Button className="w-full h-12 text-base shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-accent">
                      Gå til Tetrivo HMS
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Avviksportalen – kommer snart */}
              <Card className="relative overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 opacity-90">
                <CardHeader>
                  <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4 text-orange-600">
                    <Building2 size={28} />
                  </div>
                  <CardTitle className="text-2xl">Avviksportalen</CardTitle>
                  <CardDescription className="text-base">Dedikert system for avvikshåndtering</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Feature text="Rask innmelding av hendelser" />
                  <Feature text="Saksbehandling og tiltak" />
                  <Feature text="Statistikk og analyse" />
                  <Feature text="Lanseres høsten 2026" />
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

        {/* Hvorfor velge Tetrivo */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Hvorfor velge Tetrivo?</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Vi har bygget Tetrivo fra grunnen av for å gjøre HMS-arbeid enkelt og effektivt
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Spar tid på administrasjon</h3>
                    <p className="text-muted-foreground">Automatiser rutineoppgaver og bruk mindre tid på papirarbeid. La AI-assistenten hjelpe deg med å finne riktig informasjon raskt.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Enkel opplæring</h3>
                    <p className="text-muted-foreground">Intuitivt grensesnitt som krever minimal opplæring. De ansatte kan begynne å bruke systemet med en gang.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent shrink-0">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Alltid oppdatert</h3>
                    <p className="text-muted-foreground">Vi oppdaterer systemet kontinuerlig med nye funksjoner og sikkerhetsforbedringer – uten ekstra kostnad.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600 shrink-0">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Norsk support</h3>
                    <p className="text-muted-foreground">Få hjelp når du trenger det – på norsk. Vi er her for å sikre at du får mest mulig ut av Tetrivo.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kontakt-seksjon med skjema */}
        <section id="kontakt" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
              {/* Venstre: Kontaktinformasjon */}
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-6">La oss ta en prat</h2>
                <p className="text-xl text-muted-foreground mb-10">
                  Har du spørsmål om Tetrivo, eller ønsker du å vite mer om hvordan vi kan hjelpe din bedrift? Send oss en melding, så tar vi kontakt.
                </p>

                <div className="space-y-6">
                  <ContactInfo
                    icon={<Mail className="h-5 w-5" />}
                    title="E-post"
                    lines={['kontakt@tetrivo.com', 'support@tetrivo.com']}
                  />
                  <ContactInfo
                    icon={<MapPin className="h-5 w-5" />}
                    title="Lokasjon"
                    lines={['Kristiansand, Norge']}
                  />
                </div>

                <div className="mt-10 p-6 bg-muted/50 rounded-2xl border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">SH</div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Tetrivo Systems</p>
                      <p className="text-xs text-muted-foreground">Simen Halvorsen</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vi svarer vanligvis innen 24 timer på hverdager.
                  </p>
                </div>
              </div>

              {/* Høyre: Kontaktskjema */}
              <div>
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bunntekst */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <TetraLogo />
              <div className="h-6 w-px bg-border" />
              <p className="text-sm text-muted-foreground">
                © 2026 Tetrivo Systems
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
    </div>
  )
}

// ===== KOMPONENTER =====

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <CheckCircle size={18} className="text-green-500 shrink-0" />
      <span>{text}</span>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="relative overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="relative">
        <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function ContactInfo({ icon, title, lines }: { icon: React.ReactNode; title: string; lines: string[] }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        {lines.map((line, i) => (
          <p key={i} className="text-muted-foreground">{line}</p>
        ))}
      </div>
    </div>
  )
}

function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      company: formData.get('company'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Noe gikk galt')
      }

      setIsSubmitted(true)
    } catch (error) {
      console.error('Contact form error:', error)
      alert(error instanceof Error ? error.message : 'Kunne ikke sende henvendelsen. Prøv igjen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="p-8 text-center border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Takk for henvendelsen!</h3>
        <p className="text-muted-foreground">
          Vi har mottatt meldingen din og tar kontakt så snart som mulig.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-8 shadow-xl border-2">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">Navn *</label>
            <Input id="name" name="name" required placeholder="Ola Nordmann" className="h-12" />
          </div>
          <div>
            <label htmlFor="company" className="block text-sm font-medium mb-2">Bedrift</label>
            <Input id="company" name="company" placeholder="Bedriftsnavn AS" className="h-12" />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">E-post *</label>
          <Input id="email" name="email" type="email" required placeholder="ola@bedrift.no" className="h-12" />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">Emne *</label>
          <Input id="subject" name="subject" required placeholder="Hva gjelder henvendelsen?" className="h-12" />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">Melding *</label>
          <Textarea id="message" name="message" required placeholder="Fortell oss mer ..." className="min-h-[120px] resize-none" />
        </div>
        <Button type="submit" size="lg" className="w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-accent" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="spinner spinner-white mr-2" />
              Sender ...
            </>
          ) : (
            <>
              Send melding
              <Send className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Ved å sende inn skjemaet godtar du vår personvernerklæring.
        </p>
      </form>
    </Card>
  )
}