import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

export type AuditLogRow = {
  id: string
  created_at: string
  action_type: string
  entity_type: string
  details?: Record<string, unknown> | null
  profiles?: {
    full_name?: string | null
    email?: string | null
  } | null
}

type AuditFilter = {
  actionType: string
  startDate: string
  endDate: string
}



type Pagination = {
  total: number
  limit: number
  offset: number
}

export function useAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: 50, offset: 0 })
  const [auditFilter, setAuditFilter] = useState<AuditFilter>({
    actionType: 'all',
    startDate: '',
    endDate: ''
  })

  const loadAuditLogs = useCallback(async (offset = 0, limit = pagination.limit) => {
    setAuditLogsLoading(true)
    try {
      const params = new URLSearchParams()
      if (auditFilter.actionType !== 'all') params.append('action_type', auditFilter.actionType)
      if (auditFilter.startDate) params.append('start_date', auditFilter.startDate)
      if (auditFilter.endDate) params.append('end_date', auditFilter.endDate)
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

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
      if (data.pagination) {
        setPagination(data.pagination)
      } else {
        setPagination(prev => ({ ...prev, offset, limit }))
      }
    } catch (error) {
      console.error('Load audit logs error:', error)
      toast.error('Kunne ikke laste aktivitetslogg. Prøv igjen.')
    } finally {
      setAuditLogsLoading(false)
    }
  }, [auditFilter.actionType, auditFilter.endDate, auditFilter.startDate, pagination.limit])

  const goToPage = useCallback((page: number) => {
    const newOffset = page * pagination.limit
    loadAuditLogs(newOffset, pagination.limit)
  }, [loadAuditLogs, pagination.limit])

  const currentPage = Math.floor(pagination.offset / pagination.limit)
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return {
    auditLogs,
    auditLogsLoading,
    auditFilter,
    setAuditFilter,
    loadAuditLogs,
    pagination,
    currentPage,
    totalPages,
    goToPage
  }
}
