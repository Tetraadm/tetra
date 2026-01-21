import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'

export type ReadReportItem = {
  instruction_id: string
  instruction_title: string
  instruction_created_at: string
  total_users: number
  read_count: number
  confirmed_count: number
  read_percentage: number
  confirmed_percentage: number
}

export type UserReadStatus = {
  user_id: string
  user_name: string
  user_email: string
  has_read: boolean
  confirmed: boolean
  read_at: string | null
  confirmed_at: string | null
}

type Pagination = {
  total: number
  limit: number
  offset: number
}

export function useReadReport() {
  const [readReport, setReadReport] = useState<ReadReportItem[]>([])
  const [readReportLoading, setReadReportLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({ total: 0, limit: 20, offset: 0 })

  // For expanded instruction user details
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set())
  const [userReads, setUserReads] = useState<Map<string, UserReadStatus[]>>(new Map())
  const [userReadsLoading, setUserReadsLoading] = useState<Set<string>>(new Set())

  const loadReadReport = useCallback(async (offset = 0, limit = 20) => {
    setReadReportLoading(true)
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      })

      const response = await fetch(`/api/read-confirmations?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.report) {
        setReadReport(data.report)
      }
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Load read report error:', error)
      toast.error('Kunne ikke laste lesebekreftelser. Prøv igjen.')
    } finally {
      setReadReportLoading(false)
    }
  }, [])

  const loadUserReads = useCallback(async (instructionId: string) => {
    // Mark as loading
    setUserReadsLoading(prev => new Set(prev).add(instructionId))

    try {
      const params = new URLSearchParams({
        instruction_id: instructionId,
        limit: '50',
        offset: '0'
      })

      const response = await fetch(`/api/read-confirmations?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.user_reads) {
        setUserReads(prev => new Map(prev).set(instructionId, data.user_reads))
      }
    } catch (error) {
      console.error('Load user reads error:', error)
      toast.error('Kunne ikke laste brukerdata.')
    } finally {
      setUserReadsLoading(prev => {
        const next = new Set(prev)
        next.delete(instructionId)
        return next
      })
    }
  }, [])

  const toggleInstructionExpansion = useCallback((instructionId: string) => {
    setExpandedInstructions(prev => {
      const next = new Set(prev)
      if (next.has(instructionId)) {
        next.delete(instructionId)
      } else {
        next.add(instructionId)
        // Load user reads if not already loaded
        if (!userReads.has(instructionId)) {
          loadUserReads(instructionId)
        }
      }
      return next
    })
  }, [userReads, loadUserReads])

  const goToPage = useCallback((page: number) => {
    const newOffset = page * pagination.limit
    loadReadReport(newOffset, pagination.limit)
  }, [pagination.limit, loadReadReport])

  const currentPage = Math.floor(pagination.offset / pagination.limit)
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  return {
    readReport,
    readReportLoading,
    pagination,
    expandedInstructions,
    userReads,
    userReadsLoading,
    loadReadReport,
    loadUserReads,
    toggleInstructionExpansion,
    goToPage,
    currentPage,
    totalPages
  }
}
