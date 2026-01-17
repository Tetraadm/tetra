'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Mail, CheckCircle, Shield, Sparkles } from 'lucide-react'

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
      <div className="login-container">
        <div className="login-glow login-glow--1" />
        <div className="login-glow login-glow--2" />
        <div className="login-glow login-glow--3" />

        <div className="login-card login-card--success">
          <div className="login-success-icon">
            <CheckCircle size={48} strokeWidth={1.5} />
          </div>

          <h1 className="login-title">Sjekk e-posten din</h1>
          <p className="login-subtitle">
            Vi har sendt en innloggingslenke til
          </p>

          <div className="login-email-badge">
            <Mail size={16} />
            {email}
          </div>

          <div className="login-info-box">
            <Sparkles size={16} />
            <span>Lenken er gyldig i 1 time. Sjekk spam-mappen hvis du ikke finner e-posten.</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-container">
      <div className="login-glow login-glow--1" />
      <div className="login-glow login-glow--2" />
      <div className="login-glow login-glow--3" />

      <div className="login-card">
        <div className="login-logo">
          <Image
            src="/tetra-logo.png"
            alt="Tetra"
            width={180}
            height={50}
            style={{ height: 50, width: 'auto' }}
            priority
          />
        </div>

        <div className="login-header">
          <h1 className="login-title">Velkommen tilbake</h1>
          <p className="login-subtitle">
            Logg inn for å administrere HMS-instrukser og avvik
          </p>
        </div>

        <button
          onClick={handleAzureLogin}
          disabled={loading}
          className="login-sso-btn"
        >
          <svg width="20" height="20" viewBox="0 0 23 23">
            <path fill="#f35325" d="M0 0h10.931v10.931H0z" />
            <path fill="#81bc06" d="M12.069 0H23v10.931H12.069z" />
            <path fill="#05a6f0" d="M0 12.069h10.931V23H0z" />
            <path fill="#ffba08" d="M12.069 12.069H23V23H12.069z" />
          </svg>
          Fortsett med Microsoft
        </button>

        <div className="login-divider">
          <span>eller bruk e-post</span>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              E-postadresse
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="navn@bedrift.no"
              required
              className="form-input"
              autoComplete="email"
            />
          </div>

          <p className="login-hint">
            <Mail size={14} />
            Du får en innloggingslenke på e-post
          </p>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-lg login-submit"
          >
            {loading ? (
              <>
                <span className="spinner spinner-sm spinner-white" />
                Sender...
              </>
            ) : (
              'Send innloggingslenke'
            )}
          </button>
        </form>

        <div className="login-footer">
          <Shield size={16} />
          <span>Sikker innlogging for HMS-plattformen</span>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background: var(--hms-white, #FFFFFF);
        }

        .login-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
        }

        .login-glow--1 {
          top: -20%;
          right: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(5, 150, 105, 0.06) 0%, transparent 70%);
        }

        .login-glow--2 {
          bottom: -30%;
          left: -15%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(2, 132, 199, 0.05) 0%, transparent 70%);
        }

        .login-glow--3 {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(5, 150, 105, 0.04) 0%, transparent 70%);
        }

        .login-card {
          position: relative;
          z-index: 1;
          background: var(--hms-white, #FFFFFF);
          border: 1px solid var(--hms-frost, #E2E8F0);
          border-radius: var(--radius-2xl);
          padding: 48px 44px;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .login-card--success {
          text-align: center;
        }

        .login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 36px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-title {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--hms-charcoal, #1E293B);
          letter-spacing: -0.03em;
          margin-bottom: 10px;
        }

        .login-subtitle {
          font-size: 15px;
          color: var(--hms-slate, #64748B);
          line-height: 1.6;
        }

        .login-success-icon {
          width: 88px;
          height: 88px;
          margin: 0 auto 28px;
          background: var(--hms-safe-light, #D1FAE5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--hms-safe, #059669);
          animation: safetyPulse 2s ease-in-out infinite;
        }

        .login-email-badge {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: var(--hms-safe-light, #D1FAE5);
          border: 1px solid rgba(5, 150, 105, 0.2);
          border-radius: var(--radius-full);
          font-size: 15px;
          font-weight: 600;
          color: var(--hms-safe, #059669);
          margin-top: 16px;
        }

        .login-info-box {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 28px;
          padding: 16px 20px;
          background: var(--hms-snow, #F8FAFC);
          border: 1px solid var(--hms-frost, #E2E8F0);
          border-radius: var(--radius-lg);
          font-size: 13px;
          color: var(--hms-slate, #64748B);
          line-height: 1.5;
        }

        .login-info-box svg {
          flex-shrink: 0;
          color: var(--hms-info, #0284C7);
        }

        .login-sso-btn {
          width: 100%;
          padding: 16px 24px;
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
          color: var(--hms-charcoal, #1E293B);
          background: var(--hms-white, #FFFFFF);
          border: 1px solid var(--hms-frost, #E2E8F0);
          border-radius: var(--radius-lg);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-sso-btn:hover:not(:disabled) {
          background: var(--hms-snow, #F8FAFC);
          border-color: var(--hms-steel, #CBD5E1);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .login-sso-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-divider {
          display: flex;
          align-items: center;
          margin: 28px 0;
          gap: 16px;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--hms-frost, #E2E8F0);
        }

        .login-divider span {
          font-size: 13px;
          font-weight: 500;
          color: var(--hms-slate, #64748B);
        }

        .login-form {
          display: flex;
          flex-direction: column;
        }

        .login-hint {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--hms-slate, #64748B);
          margin-bottom: 24px;
        }

        .login-error {
          padding: 14px 18px;
          background: var(--hms-danger-light, #FEE2E2);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
          color: var(--hms-danger, #DC2626);
          margin-bottom: 20px;
        }

        .login-submit {
          width: 100%;
        }

        .login-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 28px;
          padding: 14px 18px;
          background: var(--hms-safe-light, #D1FAE5);
          border: 1px solid rgba(5, 150, 105, 0.15);
          border-radius: var(--radius-lg);
          font-size: 12px;
          color: var(--hms-charcoal, #1E293B);
        }

        .login-footer svg {
          color: var(--hms-safe, #059669);
          animation: safetyPulse 2s ease-in-out infinite;
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 36px 28px;
          }

          .login-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  )
}
