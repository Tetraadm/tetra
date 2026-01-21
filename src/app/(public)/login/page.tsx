'use client'

import { createClient } from '@/lib/supabase/client'
import { TetraLogo } from '@/components/tetra-logo'
import { useState } from 'react'
import { Mail, CheckCircle, ShieldCheck, Loader2, Key, ArrowLeft, Clock, Lock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LoginMode = 'select' | 'magic-link' | 'password'

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('select')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message === 'Invalid login credentials') {
        setError('Feil e-post eller passord')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      // Redirect happens automatically via middleware
      // Redirect to post-auth handler which routes based on role
      window.location.href = '/post-auth'
    }
  }

  const resetForm = () => {
    setMode('select')
    setEmail('')
    setPassword('')
    setError('')
    setSent(false)
  }

  // Magic link sent confirmation
  if (sent) {
    return (
      <div className="min-h-screen bg-background relative">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(14,116,144,0.12),transparent_55%)]" />
        <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-16">
          <Card className="w-full max-w-md border-border/80 bg-card/90 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-serif">Sjekk e-posten din</CardTitle>
              <CardDescription>
                Vi har sendt en innloggingslenke til
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center font-semibold text-foreground bg-primary/5 border border-primary/20 rounded-lg py-3 px-4">
                {email}
              </div>
              <div className="text-center text-sm text-muted-foreground bg-secondary/60 rounded-lg p-4">
                Lenken er gyldig i 1 time. Sjekk spam-mappen hvis du ikke finner e-posten.
              </div>
              <Button variant="outline" className="w-full" onClick={resetForm}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tilbake til innlogging
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(14,116,144,0.12),transparent_55%)]" />
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-border/80 bg-card/70 p-8 shadow-lg">
            <div className="space-y-6">
              <TetraLogo variant="full" size={36} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">Sikker innlogging</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground">
                  Trygg tilgang til HMS-arbeidet
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Velg innloggingsmetode og få sikker tilgang til alt av dokumenter, instrukser og lesebekreftelser.
                </p>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-primary" />
                  <span>Tidsbegrenset innloggingslenke sendt til e-post.</span>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 text-primary" />
                  <span>Rollebasert tilgang for ansatte, teamledere og admin.</span>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                  <span>Revisjonsspor for viktige hendelser i systemet.</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border/70 bg-secondary/60 p-4 text-xs text-muted-foreground">
              Trenger du hjelp? Kontakt oss på kontakt@tetrivo.com.
            </div>
          </div>

          <Card className="w-full max-w-md justify-self-center border-border/80 bg-card/90 shadow-xl">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-6 flex justify-center">
                <TetraLogo variant="logo-only" size={100} />
              </div>
              <CardTitle className="text-2xl font-serif">Logg inn til Tetrivo</CardTitle>
              <CardDescription>
                HMS-plattformen for trygg og dokumentert drift
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          {/* Mode Selection */}
          {mode === 'select' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-3"
                onClick={() => setMode('magic-link')}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">Innloggingslenke</div>
                  <div className="text-xs text-muted-foreground">Få lenke sendt til e-post</div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full h-14 justify-start gap-3"
                onClick={() => setMode('password')}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">E-post og passord</div>
                  <div className="text-xs text-muted-foreground">Logg inn med passord</div>
                </div>
              </Button>
            </div>
          )}

          {/* Magic Link Form */}
          {mode === 'magic-link' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Tilbake
              </Button>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  E-postadresse
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="navn@bedrift.no"
                  required
                  className="h-12"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} className="text-primary shrink-0" />
                <span>Du får en innloggingslenke på e-post</span>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sender ...
                  </>
                ) : (
                  'Send innloggingslenke'
                )}
              </Button>
            </form>
          )}

          {/* Password Login Form */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="mb-2 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Tilbake
              </Button>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  E-postadresse
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="navn@bedrift.no"
                  required
                  className="h-12"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Passord
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12"
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Logger inn ...
                  </>
                ) : (
                  'Logg inn'
                )}
              </Button>
            </form>
          )}

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 pt-2 text-muted-foreground">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-xs">Sikker innlogging til HMS-plattformen</span>
          </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
