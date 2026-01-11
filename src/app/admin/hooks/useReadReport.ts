import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import type { ReadReportItem } from '../utils'

export function useReadReport() {
  const [readReport, setReadReport] = useState<ReadReportItem[]>([])
  const [readReportLoading, setReadReportLoading] = useState(false)
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set())

  const loadReadReport = useCallback(async () => {
    setReadReportLoading(true)
    try {
      const response = await fetch('/api/read-confirmations')

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
    } catch (error) {
      console.error('Load read report error:', error)
      toast.error('Kunne ikke laste lesebekreftelser. Prøv igjen.')
    } finally {
      setReadReportLoading(false)
    }
  }, [])

  const toggleInstructionExpansion = useCallback((instructionId: string) => {
    setExpandedInstructions(prev => {
      const next = new Set(prev)
      if (next.has(instructionId)) {
        next.delete(instructionId)
      } else {
        next.add(instructionId)
      }
      return next
    })
  }, [])

  return {
    readReport,
    readReportLoading,
    expandedInstructions,
    loadReadReport,
    toggleInstructionExpansion
  }
}
