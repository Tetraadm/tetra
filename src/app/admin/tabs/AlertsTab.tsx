import { Plus } from 'lucide-react'
import type { Alert } from '@/lib/types'
import { severityLabel, severityColor } from '@/lib/ui-helpers'
import type { createAdminStyles } from '../styles'

type Props = {
  alerts: Alert[]
  styles: ReturnType<typeof createAdminStyles>
  toggleAlert: (alertId: string, active: boolean) => void
  deleteAlert: (alertId: string) => void
  setShowCreateAlert: (show: boolean) => void
}

export default function AlertsTab({ alerts, styles, toggleAlert, deleteAlert, setShowCreateAlert }: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={styles.pageTitle}>Avvik & Varsler</h1>
          <p style={styles.pageSubtitle}>Varsler vises på ansattes hjem-side</p>
        </div>
        <button style={styles.btn} onClick={() => setShowCreateAlert(true)}>
          <Plus size={16} />
          Nytt avvik
        </button>
      </div>

      {alerts.length === 0 ? (
        <div style={styles.card}><div style={styles.cardBody}><p style={{ color: '#64748B' }}>Ingen avvik</p></div></div>
      ) : (
        alerts.map(alert => (
          <div key={alert.id} style={styles.alertCard(alert.severity, alert.active)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <span style={styles.badge(severityColor(alert.severity).bg, severityColor(alert.severity).color)}>
                    {severityLabel(alert.severity)}
                  </span>
                  {!alert.active && <span style={styles.badge('#F1F5F9', '#64748B')}>Inaktiv</span>}
                </div>
                <h4 style={{ fontWeight: 600 }}>{alert.title}</h4>
                {alert.description && <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{alert.description}</p>}
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
                  {new Date(alert.created_at).toLocaleDateString('nb-NO')}
                </p>
              </div>
              <div style={styles.actionBtns}>
                <button style={styles.btnSmall} onClick={() => toggleAlert(alert.id, alert.active)}>
                  {alert.active ? 'Deaktiver' : 'Aktiver'}
                </button>
                <button style={styles.btnDanger} onClick={() => deleteAlert(alert.id)}>Slett</button>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  )
}
