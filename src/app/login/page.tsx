'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, Shield, Sparkles } from 'lucide-react'
// Using standard className strings for styling

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

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

  const handleAzureLogin = async () => {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email',
      },
    })

    if (error) {
      toast.error('Kunne ikke logge inn med Microsoft')
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
        {/* Glow Effects */}
        <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-[30%] -left-[15%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-12 text-center shadow-lg animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mb-8 animate-pulse shadow-[0_0_0_8px_rgba(22,163,74,0.1)]">
            <CheckCircle size={40} className="stroke-[1.5]" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-4 tracking-tight">Sjekk e-posten din</h1>
          <p className="text-muted-foreground mb-8 text-base">
            Vi har sendt en innloggingslenke til
          </p>

          <div className="inline-flex items-center gap-2.5 px-5 py-3 bg-green-50 border border-green-100 rounded-full text-green-700 font-semibold text-sm">
            <Mail size={16} />
            {email}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2.5 p-4 bg-muted/50 border border-border rounded-lg text-sm text-muted-foreground">
            <Sparkles size={16} className="text-blue-500 shrink-0" />
            <span>Lenken er gyldig i 1 time. Sjekk spam-mappen hvis du ikke ser den.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Glow Effects */}
      <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[30%] -left-[15%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-12 shadow-lg animate-in fade-in zoom-in-95 duration-500 hover:shadow-xl transition-shadow">
        <div className="flex justify-center mb-10">
          <Image
            src="/tetra-logo.png"
            alt="Tetra"
            width={160}
            height={44}
            className="h-11 w-auto"
            priority
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight font-display">Velkommen tilbake</h1>
          <p className="text-muted-foreground text-sm">
            Logg inn for å administrere HMS-instrukser og avvik
          </p>
        </div>

        <button
          onClick={handleAzureLogin}
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-3 bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed group"
        >
          <svg width="20" height="20" viewBox="0 0 23 23" className="group-hover:scale-105 transition-transform">
            <path fill="#f35325" d="M0 0h10.931v10.931H0z" />
            <path fill="#81bc06" d="M12.069 0H23v10.931H12.069z" />
            <path fill="#05a6f0" d="M0 12.069h10.931V23H0z" />
            <path fill="#ffba08" d="M12.069 12.069H23V23H12.069z" />
          </svg>
          Fortsett med Microsoft
        </button>

        <div className="relative flex items-center py-8">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">eller bruk e-post</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-foreground">
              E-postadresse
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="navn@bedrift.no"
              required
              className="w-full h-11 px-4 text-sm bg-muted/30 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all placeholder:text-muted-foreground/60"
              autoComplete="email"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail size={14} className="text-primary/70" />
            <span>Du får en innloggingslenke på e-post</span>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-semibold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Sender...
              </>
            ) : (
              'Send innloggingslenke'
            )}
          </button>
        </form>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground/70 bg-muted/30 py-3 rounded-lg border border-border/50">
          <Shield size={14} className="text-primary/60" />
          <span>Sikker innlogging for HMS-plattformen</span>
        </div>
      </div>
    </div>
  )
}
