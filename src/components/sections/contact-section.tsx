"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MapPin, Send, CheckCircle } from 'lucide-react'

export function ContactSection() {
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

    return (
        <section id="kontakt" className="relative py-24 bg-background">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.08),transparent_55%)]" />
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 max-w-6xl mx-auto">
                    {/* Venstre: Kontaktinformasjon */}
                    <div>
                        <h2 className="font-serif text-3xl md:text-5xl font-semibold mb-6">La oss sikre HMS-arbeidet sammen</h2>
                        <p className="text-xl text-muted-foreground mb-10">
                            Har du spørsmål om Tetrivo, eller ønsker du en trygg pilot? Send oss en melding, så setter vi opp neste steg.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">E-post</h3>
                                    <p className="text-muted-foreground">kontakt@tetrivo.com</p>
                                    <p className="text-muted-foreground">support@tetrivo.com</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                                    <MapPin className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Lokasjon</h3>
                                    <p className="text-muted-foreground">Kristiansand, Norge</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 p-6 bg-secondary/60 rounded-2xl border border-border/80">
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
                                Vi svarer normalt innen 24 timer på hverdager.
                            </p>
                        </div>
                    </div>

                    {/* Høyre: Kontaktskjema */}
                    <div>
                        {isSubmitted ? (
                            <Card className="p-8 text-center border-2 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
                                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Takk for henvendelsen!</h3>
                                <p className="text-muted-foreground">
                                    Vi har mottatt meldingen din og tar kontakt så snart som mulig.
                                </p>
                            </Card>
                        ) : (
                            <Card className="p-8 shadow-xl border-2 border-border/80 bg-card/90">
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
                                    <Button type="submit" size="lg" className="w-full h-14 text-lg shadow-lg hover:shadow-xl transition-all" disabled={isSubmitting}>
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
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
