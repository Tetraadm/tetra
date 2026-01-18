'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, Shield, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Sjekk e-posten din</CardTitle>
            <CardDescription>
              Vi har sendt en innloggingslenke til
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center font-semibold text-foreground bg-primary/5 border border-primary/20 rounded-lg py-3 px-4">
              {email}
            </div>
            <div className="text-center text-sm text-muted-foreground bg-muted rounded-lg p-4">
              Lenken er gyldig i 1 time. Sjekk spam-mappen hvis du ikke finner e-posten.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4 text-primary-foreground font-bold text-2xl shadow-lg">
            T
          </div>
          <CardTitle className="text-2xl">Logg inn på Tetra</CardTitle>
          <CardDescription>
            HMS-plattformen for sikker arbeidsplass
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Microsoft Login */}
          <Button
            variant="outline"
            className="w-full h-12 gap-3 font-semibold"
            onClick={handleAzureLogin}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 23 23">
              <path fill="#f35325" d="M0 0h10.931v10.931H0z" />
              <path fill="#81bc06" d="M12.069 0H23v10.931H12.069z" />
              <path fill="#05a6f0" d="M0 12.069h10.931V23H0z" />
              <path fill="#ffba08" d="M12.069 12.069H23V23H12.069z" />
            </svg>
            Fortsett med Microsoft
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground font-medium">eller</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
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
                  Sender...
                </>
              ) : (
                'Send innloggingslenke'
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-center gap-2 pt-2 text-muted-foreground">
            <Shield size={16} className="text-primary" />
            <span className="text-xs">Sikker innlogging til HMS-plattformen</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
