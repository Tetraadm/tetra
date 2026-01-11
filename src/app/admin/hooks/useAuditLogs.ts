import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import type { AuditLogRow } from '../utils'

type AuditFilter = {
  actionType: string
  startDate: string
  endDate: string
}

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [auditFilter, setAuditFilter] = useState<AuditFilter>({
    actionType: 'all',
    startDate: '',
    endDate: ''
  })

  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true)
    try {
      const params = new URLSearchParams()
      if (auditFilter.actionType !== 'all') params.append('action_type', auditFilter.actionType)
      if (auditFilter.startDate) params.append('start_date', auditFilter.startDate)
      if (auditFilter.endDate) params.append('end_date', auditFilter.endDate)

      const response = await fetch(`/api/audit-logs?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.logs) {
        setAuditLogs(data.logs)
      }
    } catch (error) {
      console.error('Load audit logs error:', error)
      toast.error('Kunne ikke laste aktivitetslogg. Prøv igjen.')
    } finally {
      setAuditLogsLoading(false)
    }
  }, [auditFilter.actionType, auditFilter.endDate, auditFilter.startDate])

  return {
    auditLogs,
    auditLogsLoading,
    auditFilter,
    setAuditFilter,
    loadAuditLogs
  }
}
