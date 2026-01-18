import { BarChart3, Download } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
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
  setAuditFilter: (filter: AuditFilter) => void
  loadAuditLogs: () => void
}

export default function AuditLogTab({
  auditLogs,
  auditLogsLoading,
  auditFilter,
  setAuditFilter,
  loadAuditLogs
}: Props) {
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
            Aktivitetslogg
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)'
          }}>
            Sporbar logg over kritiske admin-handlinger
          </p>
        </div>
        <button
          className="nt-btn nt-btn-primary"
          onClick={() => exportAuditCSV(auditLogs, formatActionTypeFn)}
        >
          <Download size={16} />
          <span>Eksporter CSV</span>
        </button>
      </div>

      <div className="nt-card" style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{
          fontSize: '1.0625rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-5)'
        }}>
          Filtrer aktivitetslogg
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>
              Handlingstype
            </label>
            <select
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                outline: 'none'
              }}
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
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>
              Fra dato
            </label>
            <input
              type="date"
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                outline: 'none'
              }}
              value={auditFilter.startDate}
              onChange={(e) => setAuditFilter({ ...auditFilter, startDate: e.target.value })}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-2)'
            }}>
              Til dato
            </label>
            <input
              type="date"
              style={{
                width: '100%',
                padding: 'var(--space-3) var(--space-4)',
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                outline: 'none'
              }}
              value={auditFilter.endDate}
              onChange={(e) => setAuditFilter({ ...auditFilter, endDate: e.target.value })}
            />
          </div>
          <button
            className="nt-btn nt-btn-primary"
            onClick={loadAuditLogs}
            disabled={auditLogsLoading}
          >
            {auditLogsLoading ? 'Laster...' : 'Filtrer'}
          </button>
        </div>
      </div>

      <div className="nt-card">
        <h3 style={{
          fontSize: '1.0625rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 'var(--space-5)'
        }}>
          Aktivitetslogg ({auditLogs.length} hendelser)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table className="nt-table">
            <thead>
              <tr>
                <th>Tidspunkt</th>
                <th>Bruker</th>
                <th>Handling</th>
                <th>Detaljer</th>
              </tr>
            </thead>
            <tbody>
              {auditLogsLoading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div className="nt-skeleton" style={{ height: 20, width: '60%', margin: '0 auto' }}></div>
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <EmptyState
                      icon={<BarChart3 size={48} aria-hidden="true" />}
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
                  <tr key={log.id}>
                    <td style={{ fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                      {new Date(log.created_at).toLocaleString('no-NO', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{log.profiles?.full_name || 'Ukjent'}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                        {log.profiles?.email || ''}
                      </div>
                    </td>
                    <td>
                      <span
                        className="nt-badge"
                        style={{
                          background: log.action_type.includes('delete')
                            ? 'var(--color-danger-50)'
                            : log.action_type.includes('publish')
                            ? 'var(--color-success-50)'
                            : 'var(--color-primary-50)',
                          color: log.action_type.includes('delete')
                            ? '#991B1B'
                            : log.action_type.includes('publish')
                            ? '#065F46'
                            : 'var(--color-primary-700)'
                        }}
                      >
                        {formatActionTypeFn(log.action_type)}
                      </span>
                    </td>
                    <td>
                      {log.details && typeof log.details === 'object' && (
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
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
