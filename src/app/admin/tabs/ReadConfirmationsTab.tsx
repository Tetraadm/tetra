import { Download, ChevronDown, ChevronRight } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import type { createAdminStyles } from '../styles'
import { exportReadReportCSV as exportReadCSV, type ReadReportItem } from '../utils'

type Props = {
  readReport: ReadReportItem[]
  readReportLoading: boolean
  expandedInstructions: Set<string>
  styles: ReturnType<typeof createAdminStyles>
  toggleInstructionExpansion: (id: string) => void
}

export default function ReadConfirmationsTab({
  readReport,
  readReportLoading,
  expandedInstructions,
  styles,
  toggleInstructionExpansion
}: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={styles.pageTitle}>Lesebekreftelser</h1>
          <p style={styles.pageSubtitle}>Oversikt over hvem som har lest og bekreftet instrukser</p>
        </div>
        <button style={styles.btn} onClick={() => exportReadCSV(readReport)}>
          <Download size={16} />
          Eksporter CSV
        </button>
      </div>

      {readReportLoading ? (
        <div style={{ ...styles.card, padding: 48, textAlign: 'center', color: '#64748B' }}>
          Laster lesebekreftelser...
        </div>
      ) : readReport.length === 0 ? (
        <div style={styles.card}>
          <EmptyState
            icon="📋"
            title="Ingen lesebekreftelser ennå"
            description="Når ansatte begynner å lese og bekrefte instrukser, vil de vises her."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {readReport.map((instruction) => {
            const isExpanded = expandedInstructions.has(instruction.instruction_id)
            return (
              <div key={instruction.instruction_id} style={styles.card}>
                <div
                  style={{
                    ...styles.cardHeader,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => toggleInstructionExpansion(instruction.instruction_id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <span style={{ fontWeight: 600 }}>{instruction.instruction_title}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <div>
                      <span style={{ color: '#64748B' }}>Lest: </span>
                      <span style={{ fontWeight: 600, color: '#3B82F6' }}>
                        {instruction.read_count}/{instruction.total_users} ({instruction.read_percentage}%)
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B' }}>Bekreftet: </span>
                      <span style={{ fontWeight: 600, color: '#10B981' }}>
                        {instruction.confirmed_count}/{instruction.total_users} ({instruction.confirmed_percentage}%)
                      </span>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div style={styles.cardBody}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Ansatt</th>
                            <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>E-post</th>
                            <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Lest</th>
                            <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Bekreftet</th>
                            <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Dato</th>
                          </tr>
                        </thead>
                        <tbody>
                          {instruction.user_statuses.map((user) => (
                            <tr key={user.user_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: 12, fontSize: 13, fontWeight: 500 }}>{user.user_name}</td>
                              <td style={{ padding: 12, fontSize: 13, color: '#64748B' }}>{user.user_email}</td>
                              <td style={{ padding: 12, textAlign: 'center' }}>
                                {user.read ? (
                                  <span style={{ color: '#3B82F6', fontSize: 16 }}>✓</span>
                                ) : (
                                  <span style={{ color: '#CBD5E1', fontSize: 16 }}>○</span>
                                )}
                              </td>
                              <td style={{ padding: 12, textAlign: 'center' }}>
                                {user.confirmed ? (
                                  <span style={{ color: '#10B981', fontSize: 16 }}>✓</span>
                                ) : (
                                  <span style={{ color: '#CBD5E1', fontSize: 16 }}>○</span>
                                )}
                              </td>
                              <td style={{ padding: 12, fontSize: 13, color: '#64748B' }}>
                                {user.confirmed_at ? (
                                  new Date(user.confirmed_at).toLocaleString('no-NO', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                ) : user.read_at ? (
                                  new Date(user.read_at).toLocaleString('no-NO', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                ) : (
                                  '-'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
