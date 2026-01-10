/**
 * Utility functions for AdminDashboard
 */

/**
 * Translate action types to Norwegian
 */
export function formatActionType(actionType: string): string {
  const translations: Record<string, string> = {
    'create_instruction': 'Opprettet instruks',
    'publish_instruction': 'Publisert instruks',
    'unpublish_instruction': 'Avpublisert instruks',
    'delete_instruction': 'Slettet instruks',
    'create_user': 'Opprettet bruker',
    'edit_user': 'Redigert bruker',
    'delete_user': 'Slettet bruker',
    'invite_user': 'Invitert bruker',
    'change_role': 'Endret rolle'
  }
  return translations[actionType] || actionType
}

/**
 * Export audit logs to CSV file
 */
export function exportAuditLogsCSV(
  auditLogs: any[],
  formatActionTypeFn: (actionType: string) => string
): void {
  const headers = ['Tidspunkt', 'Bruker', 'Handling', 'Entitet', 'Detaljer']
  const rows = auditLogs.map(log => [
    new Date(log.created_at).toLocaleString('nb-NO'),
    log.profiles?.full_name || 'Ukjent',
    formatActionTypeFn(log.action_type),
    log.entity_type,
    JSON.stringify(log.details)
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

/**
 * Export read confirmations report to CSV file
 */
export function exportReadReportCSV(readReport: any[]): void {
  const rows: string[][] = []

  readReport.forEach(item => {
    item.user_statuses.forEach((userStatus: any) => {
      rows.push([
        item.instruction_title,
        userStatus.user_name,
        userStatus.user_email,
        userStatus.read ? 'Ja' : 'Nei',
        userStatus.confirmed ? 'Ja' : 'Nei',
        userStatus.read_at ? new Date(userStatus.read_at).toLocaleString('nb-NO') : '',
        userStatus.confirmed_at ? new Date(userStatus.confirmed_at).toLocaleString('nb-NO') : ''
      ])
    })
  })

  const headers = ['Instruks', 'Bruker', 'E-post', 'Lest', 'Bekreftet', 'Lest tidspunkt', 'Bekreftet tidspunkt']
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `lesebekreftelser-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}
