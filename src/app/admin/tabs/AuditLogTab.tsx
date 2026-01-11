import { Download } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import type { createAdminStyles } from '../styles'
import {
  formatActionType as formatActionTypeFn,
  exportAuditLogsCSV as exportAuditCSV,
  type AuditLogRow
} from '../utils'

type AuditFilter = {
  actionType: string
  startDate: string
  endDate: string
}

type Props = {
  auditLogs: AuditLogRow[]
  auditLogsLoading: boolean
  auditFilter: AuditFilter
  styles: ReturnType<typeof createAdminStyles>
  setAuditFilter: (filter: AuditFilter) => void
  loadAuditLogs: () => void
}

export default function AuditLogTab({
  auditLogs,
  auditLogsLoading,
  auditFilter,
  styles,
  setAuditFilter,
  loadAuditLogs
}: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={styles.pageTitle}>Aktivitetslogg</h1>
          <p style={styles.pageSubtitle}>Sporbar logg over kritiske admin-handlinger</p>
        </div>
        <button style={styles.btn} onClick={() => exportAuditCSV(auditLogs, formatActionTypeFn)}>
          <Download size={16} />
          Eksporter CSV
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>Filtrer aktivitetslogg</div>
        <div style={styles.cardBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={styles.label}>Handlingstype</label>
              <select
                style={styles.select}
                value={auditFilter.actionType}
                onChange={(e) => setAuditFilter({ ...auditFilter, actionType: e.target.value })}
              >
                <option value="all">Alle handlinger</option>
                <option value="create_instruction">Opprett instruks</option>
                <option value="publish_instruction">Publiser instruks</option>
                <option value="unpublish_instruction">Avpubliser instruks</option>
                <option value="delete_instruction">Slett instruks</option>
                <option value="create_user">Opprett bruker</option>
                <option value="edit_user">Rediger bruker</option>
                <option value="delete_user">Slett bruker</option>
                <option value="invite_user">Inviter bruker</option>
                <option value="change_role">Endre rolle</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Fra dato</label>
              <input
                type="date"
                style={styles.input}
                value={auditFilter.startDate}
                onChange={(e) => setAuditFilter({ ...auditFilter, startDate: e.target.value })}
              />
            </div>
            <div>
              <label style={styles.label}>Til dato</label>
              <input
                type="date"
                style={styles.input}
                value={auditFilter.endDate}
                onChange={(e) => setAuditFilter({ ...auditFilter, endDate: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button style={styles.btn} onClick={loadAuditLogs} disabled={auditLogsLoading}>
                {auditLogsLoading ? 'Laster...' : 'Filtrer'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>Aktivitetslogg ({auditLogs.length} hendelser)</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Tidspunkt</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Bruker</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Handling</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Detaljer</th>
              </tr>
            </thead>
            <tbody>
              {auditLogsLoading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
                    Laster aktivitetslogg...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <EmptyState
                      icon="📊"
                      title="Ingen aktivitet funnet"
                      description="Prøv å endre filtrene eller kom tilbake senere."
                      actionLabel="Nullstill filter"
                      onAction={() => {
                        setAuditFilter({ actionType: 'all', startDate: '', endDate: '' })
                        loadAuditLogs()
                      }}
                    />
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      {new Date(log.created_at).toLocaleString('no-NO', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{log.profiles?.full_name || 'Ukjent'}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{log.profiles?.email || ''}</div>
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: log.action_type.includes('delete') ? '#FEE2E2' : log.action_type.includes('publish') ? '#D1FAE5' : '#DBEAFE',
                        color: log.action_type.includes('delete') ? '#DC2626' : log.action_type.includes('publish') ? '#10B981' : '#3B82F6'
                      }}>
                        {formatActionTypeFn(log.action_type)}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      {log.details && typeof log.details === 'object' && (
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key}>
                              <strong>{key}:</strong> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
