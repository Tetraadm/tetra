import { AlertTriangle } from 'lucide-react'
import type { Profile, Alert, Instruction } from '@/lib/types'
import { severityLabel, severityColor } from '@/lib/ui-helpers'

type Props = {
  profile: Profile
  users: Profile[]
  instructions: Instruction[]
  alerts: Alert[]
  setTab: (tab: 'avvik') => void
}

export default function OverviewTab({ profile, users, instructions, alerts, setTab }: Props) {
  const activeAlerts = alerts.filter(a => a.active)
  const publishedInstructions = instructions.filter(i => i.status === 'published')
  const draftInstructions = instructions.filter(i => i.status === 'draft')

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 8,
          letterSpacing: '-0.02em'
        }}>
          Oversikt
        </h1>
        <p style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)'
        }}>
          Velkommen, {profile.full_name}
        </p>
      </div>

      <div className="nt-grid-2 nt-mb-8">
        <div className="nt-stat-card">
          <div className="nt-stat-card__value">{users.length}</div>
          <div className="nt-stat-card__label">Totale brukere</div>
        </div>
        <div className="nt-stat-card">
          <div className="nt-stat-card__value">{publishedInstructions.length}</div>
          <div className="nt-stat-card__label">Publiserte instrukser</div>
        </div>
        <div className="nt-stat-card">
          <div className="nt-stat-card__value">{draftInstructions.length}</div>
          <div className="nt-stat-card__label">Utkast</div>
        </div>
        <div className="nt-stat-card">
          <div className="nt-stat-card__value" style={{
            color: activeAlerts.length > 0 ? 'var(--color-danger-600)' : 'var(--text-primary)'
          }}>
            {activeAlerts.length}
          </div>
          <div className="nt-stat-card__label">Aktive avvik</div>
        </div>
      </div>

      {activeAlerts.length > 0 && (
        <div className="nt-card" style={{
          background: 'linear-gradient(135deg, var(--color-danger-50), #FEE2E2)',
          border: '2px solid #FCA5A5',
          padding: 'var(--space-6)',
          display: 'flex',
          alignItems: 'start',
          gap: 'var(--space-4)'
        }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-danger-600)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '1rem',
              fontWeight: 600,
              marginBottom: 12,
              color: '#991B1B'
            }}>
              {activeAlerts.length} aktive avvik krever oppmerksomhet
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeAlerts.slice(0, 3).map(alert => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    className="nt-badge"
                    style={{
                      background: severityColor(alert.severity).bg,
                      color: severityColor(alert.severity).color
                    }}
                  >
                    {severityLabel(alert.severity)}
                  </span>
                  <span style={{ fontSize: '0.9375rem', color: '#7F1D1D', fontWeight: 500 }}>
                    {alert.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            className="nt-btn nt-btn-secondary nt-btn-sm"
            onClick={() => setTab('avvik')}
            style={{ flexShrink: 0 }}
          >
            Se alle
          </button>
        </div>
      )}
    </>
  )
}
