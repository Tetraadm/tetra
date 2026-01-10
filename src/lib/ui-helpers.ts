/**
 * Shared UI helper functions for severity, role labels, and colors
 */

export type SeverityType = 'critical' | 'medium' | 'low'
export type RoleType = 'admin' | 'teamleader' | 'employee'

/**
 * Convert severity value to Norwegian label
 */
export function severityLabel(severity: string): string {
  if (severity === 'critical') return 'Kritisk'
  if (severity === 'medium') return 'Middels'
  return 'Lav'
}

/**
 * Get background and text color for severity badge
 */
export function severityColor(severity: string): { bg: string; color: string } {
  if (severity === 'critical') return { bg: '#FEF2F2', color: '#DC2626' }
  if (severity === 'medium') return { bg: '#FFFBEB', color: '#F59E0B' }
  return { bg: '#ECFDF5', color: '#10B981' }
}

/**
 * Convert role value to Norwegian label
 */
export function roleLabel(role: string): string {
  if (role === 'admin') return 'Sikkerhetsansvarlig'
  if (role === 'teamleader') return 'Teamleder'
  return 'Ansatt'
}

/**
 * Get background and text color for status badge
 */
export function statusColor(status: string): { bg: string; color: string } {
  if (status === 'published') return { bg: '#ECFDF5', color: '#10B981' }
  return { bg: '#FEF3C7', color: '#D97706' }
}
