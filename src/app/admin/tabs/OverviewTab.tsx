import { Users, FileText, AlertTriangle } from 'lucide-react'
import type { Profile, Alert, Instruction } from '@/lib/types'
import { severityLabel, severityColor } from '@/lib/ui-helpers'
import type { createAdminStyles } from '../styles'

type Props = {
  profile: Profile
  users: Profile[]
  instructions: Instruction[]
  alerts: Alert[]
  styles: ReturnType<typeof createAdminStyles>
  setTab: (tab: 'avvik') => void
}

export default function OverviewTab({ profile, users, instructions, alerts, styles, setTab }: Props) {
  return (
    <>
      <h1 style={styles.pageTitle}>Oversikt</h1>
      <p style={styles.pageSubtitle}>Velkommen, {profile.full_name}</p>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIconBox('default')}>
            <Users size={20} />
          </div>
          <div style={styles.statValue}>{users.length}</div>
          <div style={styles.statLabel}>Brukere</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIconBox('default')}>
            <FileText size={20} />
          </div>
          <div style={styles.statValue}>{instructions.filter(i => i.status === 'published').length}</div>
          <div style={styles.statLabel}>Publiserte instrukser</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIconBox('default')}>
            <FileText size={20} />
          </div>
          <div style={styles.statValue}>{instructions.filter(i => i.status === 'draft').length}</div>
          <div style={styles.statLabel}>Utkast</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIconBox('danger')}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ ...styles.statValue, color: alerts.filter(a => a.active).length > 0 ? '#DC2626' : '#0F172A' }}>
            {alerts.filter(a => a.active).length}
          </div>
          <div style={styles.statLabel}>Aktive avvik</div>
        </div>
      </div>

      {alerts.filter(a => a.active).length > 0 && (
        <div style={styles.alertCallout}>
          <AlertTriangle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#0F172A' }}>
              {alerts.filter(a => a.active).length} aktive avvik
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.filter(a => a.active).slice(0, 3).map(alert => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={styles.badge(severityColor(alert.severity).bg, severityColor(alert.severity).color)}>
                    {severityLabel(alert.severity)}
                  </span>
                  <span style={{ fontSize: 14, color: '#334155' }}>{alert.title}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            style={{ ...styles.btnSmall, flexShrink: 0 }}
            onClick={() => setTab('avvik')}
          >
            Se alle
          </button>
        </div>
      )}
    </>
  )
}
