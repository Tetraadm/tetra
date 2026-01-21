import { Check, ChevronDown, ChevronRight, ChevronLeft, ClipboardList, X, Loader } from 'lucide-react'
import EmptyState from '@/components/EmptyState'
import type { ReadReportItem, UserReadStatus } from '../hooks/useReadReport'

type Props = {
  readReport: ReadReportItem[]
  readReportLoading: boolean
  expandedInstructions: Set<string>
  userReads: Map<string, UserReadStatus[]>
  userReadsLoading: Set<string>
  toggleInstructionExpansion: (id: string) => void
  // Pagination
  currentPage: number
  totalPages: number
  goToPage: (page: number) => void
}

export default function ReadConfirmationsTab({
  readReport,
  readReportLoading,
  expandedInstructions,
  userReads,
  userReadsLoading,
  toggleInstructionExpansion,
  currentPage,
  totalPages,
  goToPage
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
            Lesebekreftelser
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)'
          }}>
            Oversikt over hvem som har lest og bekreftet instrukser
          </p>
        </div>
        {/* CSV export disabled for new paginated structure - would need separate endpoint */}
      </div>

      {readReportLoading ? (
        <div className="nt-card" style={{ padding: 48, textAlign: 'center' }}>
          <div className="nt-skeleton nt-skeleton-title" style={{ margin: '0 auto' }}></div>
          <div className="nt-skeleton nt-skeleton-text" style={{ margin: '16px auto 0' }}></div>
        </div>
      ) : readReport.length === 0 ? (
        <div className="nt-card">
          <EmptyState
            icon={<ClipboardList size={48} aria-hidden="true" />}
            title="Ingen lesebekreftelser ennå"
            description="Når ansatte begynner å lese og bekrefte instrukser, vil de vises her."
          />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {readReport.map((instruction) => {
              const isExpanded = expandedInstructions.has(instruction.instruction_id)
              const isLoadingUsers = userReadsLoading.has(instruction.instruction_id)
              const users = userReads.get(instruction.instruction_id) || []

              return (
                <div key={instruction.instruction_id} className="nt-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 'var(--space-5) var(--space-6)',
                      background: isExpanded ? 'var(--bg-secondary)' : 'transparent',
                      borderBottom: isExpanded ? '1px solid var(--border-subtle)' : 'none',
                      transition: 'background var(--transition-fast)'
                    }}
                    onClick={() => toggleInstructionExpansion(instruction.instruction_id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {isExpanded ? (
                        <ChevronDown size={20} style={{ color: 'var(--text-secondary)' }} />
                      ) : (
                        <ChevronRight size={20} style={{ color: 'var(--text-secondary)' }} />
                      )}
                      <span style={{
                        fontWeight: 600,
                        fontSize: '1.0625rem',
                        color: 'var(--text-primary)'
                      }}>
                        {instruction.instruction_title}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: 24,
                      fontSize: '0.875rem',
                      flexWrap: 'wrap'
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Lest: </span>
                        <span style={{
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-primary-600)'
                        }}>
                          {instruction.read_count}/{instruction.total_users} ({instruction.read_percentage}%)
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>Bekreftet: </span>
                        <span style={{
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--color-success-600)'
                        }}>
                          {instruction.confirmed_count}/{instruction.total_users} ({instruction.confirmed_percentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: 'var(--space-6)' }}>
                      {isLoadingUsers ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                          <Loader size={16} className="animate-spin" />
                          <span>Laster brukerdata...</span>
                        </div>
                      ) : users.length === 0 ? (
                        <p style={{ color: 'var(--text-tertiary)' }}>Ingen brukere funnet</p>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table className="nt-table">
                            <thead>
                              <tr>
                                <th>Ansatt</th>
                                <th>E-post</th>
                                <th style={{ textAlign: 'center' }}>Lest</th>
                                <th style={{ textAlign: 'center' }}>Bekreftet</th>
                                <th>Dato</th>
                              </tr>
                            </thead>
                            <tbody>
                              {users.map((user) => (
                                <tr key={user.user_id}>
                                  <td style={{ fontWeight: 500 }}>{user.user_name}</td>
                                  <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                                    {user.user_email}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {user.has_read ? (
                                      <Check size={18} style={{ color: 'var(--color-primary-600)' }} aria-hidden="true" />
                                    ) : (
                                      <X size={18} style={{ color: 'var(--border-emphasis)' }} aria-hidden="true" />
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {user.confirmed ? (
                                      <Check size={18} style={{ color: 'var(--color-success-600)' }} aria-hidden="true" />
                                    ) : (
                                      <X size={18} style={{ color: 'var(--border-emphasis)' }} aria-hidden="true" />
                                    )}
                                  </td>
                                  <td style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.8125rem',
                                    fontFamily: 'var(--font-mono)'
                                  }}>
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
                                      '—'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              marginTop: 24
            }}>
              <button
                className="nt-btn nt-btn-secondary"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                style={{ opacity: currentPage === 0 ? 0.5 : 1 }}
              >
                <ChevronLeft size={16} />
                Forrige
              </button>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Side {currentPage + 1} av {totalPages}
              </span>
              <button
                className="nt-btn nt-btn-secondary"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                style={{ opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}
              >
                Neste
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
