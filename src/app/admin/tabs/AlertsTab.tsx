import { Plus, Inbox } from 'lucide-react'
import type { Alert } from '@/lib/types'
import { severityLabel, severityColor } from '@/lib/ui-helpers'

type Props = {
  alerts: Alert[]
  toggleAlert: (alertId: string, active: boolean) => void
  deleteAlert: (alertId: string) => void
  setShowCreateAlert: (show: boolean) => void
}

export default function AlertsTab({ alerts, toggleAlert, deleteAlert, setShowCreateAlert }: Props) {
  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{
            fontSize: '1.875rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 8,
            letterSpacing: '-0.02em'
          }}>
            Avvik & Varsler
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)'
          }}>
            Varsler vises på ansattes hjemmeside
          </p>
        </div>
        <button className="nt-btn nt-btn-primary" onClick={() => setShowCreateAlert(true)}>
          <Plus size={16} />
          <span>Nytt avvik</span>
        </button>
      </div>

      {alerts.length === 0 ? (
        <div className="nt-empty-state">
          <Inbox className="nt-empty-state__icon" />
          <h3 className="nt-empty-state__title">Ingen avvik registrert</h3>
          <p className="nt-empty-state__description">
            Opprett ditt første avvik eller varsel. Aktive varsler vises på ansattes hjemmeside.
          </p>
          <button className="nt-btn nt-btn-primary" onClick={() => setShowCreateAlert(true)}>
            <Plus size={16} />
            <span>Nytt avvik</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {alerts.map(alert => (
            <div key={alert.id} className="nt-card" style={{
              borderLeft: `4px solid ${severityColor(alert.severity).color}`,
              opacity: alert.active ? 1 : 0.6
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <span
                      className="nt-badge"
                      style={{
                        background: severityColor(alert.severity).bg,
                        color: severityColor(alert.severity).color
                      }}
                    >
                      {severityLabel(alert.severity)}
                    </span>
                    {!alert.active && (
                      <span className="nt-badge nt-badge--inactive">
                        Inaktiv
                      </span>
                    )}
                  </div>
                  <h4 style={{
                    fontWeight: 600,
                    fontSize: '1.0625rem',
                    color: 'var(--text-primary)',
                    marginBottom: 8
                  }}>
                    {alert.title}
                  </h4>
                  {alert.description && (
                    <p style={{
                      fontSize: '0.9375rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6
                    }}>
                      {alert.description}
                    </p>
                  )}
                  <p style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text-tertiary)',
                    marginTop: 12
                  }}>
                    Opprettet: {new Date(alert.created_at).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'start' }}>
                  <button
                    className="nt-btn nt-btn-secondary nt-btn-sm"
                    onClick={() => toggleAlert(alert.id, alert.active)}
                  >
                    {alert.active ? 'Deaktiver' : 'Aktiver'}
                  </button>
                  <button
                    className="nt-btn nt-btn-danger nt-btn-sm"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    Slett
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
