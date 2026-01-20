/**
 * Tetra HMS - UI Helper Functions
 * Nordic Aurora Design System
 *
 * Shared utilities for severity, role labels, colors, and styling
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ColorSet {
  bg: string
  color: string
  border?: string
}

// ============================================
// DESIGN TOKENS - Nordic Aurora Palette
// ============================================

export const colors = {
  // Primary - Aurora Green
  primary: '#00d4aa',
  primaryHover: '#00c4b4',
  primaryActive: '#00b3a3',
  primaryMuted: 'rgba(0, 212, 170, 0.25)',
  primarySubtle: 'rgba(0, 212, 170, 0.08)',

  // Background & Surface (Dark mode)
  background: '#0a0f1a',
  backgroundSubtle: '#0f1424',
  surface: '#141a2e',
  surfaceHover: '#1a2139',

  // Text (Dark mode)
  text: 'rgba(255, 255, 255, 0.95)',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted: 'rgba(255, 255, 255, 0.35)',
  textInverse: '#050810',

  // Borders
  border: 'rgba(255, 255, 255, 0.12)',
  borderStrong: 'rgba(255, 255, 255, 0.18)',
  borderSubtle: 'rgba(255, 255, 255, 0.08)',

  // Semantic - Danger/Critical
  danger: '#ef4444',
  dangerHover: '#dc2626',
  dangerLight: 'rgba(239, 68, 68, 0.12)',
  dangerBorder: 'rgba(239, 68, 68, 0.25)',

  // Semantic - Warning/High
  warning: '#f59e0b',
  warningHover: '#d97706',
  warningLight: 'rgba(245, 158, 11, 0.12)',
  warningBorder: 'rgba(245, 158, 11, 0.25)',

  // Semantic - High Priority (Orange)
  high: '#ea580c',
  highLight: 'rgba(234, 88, 12, 0.12)',
  highBorder: 'rgba(234, 88, 12, 0.25)',

  // Semantic - Success/Low
  success: '#22c55e',
  successHover: '#16a34a',
  successLight: 'rgba(34, 197, 94, 0.12)',
  successBorder: 'rgba(34, 197, 94, 0.25)',

  // Semantic - Info
  info: '#00a8ff',
  infoHover: '#0091e0',
  infoLight: 'rgba(0, 168, 255, 0.12)',
  infoBorder: 'rgba(0, 168, 255, 0.25)',

  // Aurora accent colors
  auroraGreen: '#00d4aa',
  auroraViolet: '#7b61ff',
  auroraBlue: '#00a8ff',
  auroraPink: '#ff6b9d',
} as const

// ============================================
// SHADOWS - Aurora glow effects
// ============================================

export const shadows = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.3)',
  sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
  md: '0 4px 16px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.6)',
  elevated: '0 12px 40px rgba(0, 0, 0, 0.5)',
  focus: '0 0 0 3px rgba(0, 212, 170, 0.2)',
  focusDanger: '0 0 0 3px rgba(239, 68, 68, 0.2)',
  glow: '0 0 40px rgba(0, 212, 170, 0.15)',
  glowViolet: '0 0 40px rgba(123, 97, 255, 0.12)',
} as const

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
} as const

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  fast: '120ms cubic-bezier(0.16, 1, 0.3, 1)',
  normal: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
  slow: '350ms cubic-bezier(0.16, 1, 0.3, 1)',
  spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

// ============================================
// SEVERITY HELPERS
// ============================================

/**
 * Convert severity value to Norwegian label
 */
export function severityLabel(severity: string): string {
  switch (severity) {
    case 'critical': return 'Kritisk'
    case 'medium': return 'Middels'
    case 'low': return 'Lav'
    default: return 'Ukjent'
  }
}

/**
 * Get styling for severity badge - Nordic Aurora colors
 */
export function severityColor(severity: string): ColorSet {
  switch (severity) {
    case 'critical':
      return {
        bg: colors.dangerLight,
        color: colors.danger,
        border: colors.dangerBorder
      }
    case 'medium':
      return {
        bg: colors.warningLight,
        color: colors.warning,
        border: colors.warningBorder
      }
    case 'low':
    default:
      return {
        bg: colors.successLight,
        color: colors.success,
        border: colors.successBorder
      }
  }
}

// ============================================
// ROLE HELPERS
// ============================================

/**
 * Convert role value to Norwegian label
 */
export function roleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Sikkerhetsansvarlig'
    case 'teamleader': return 'Teamleder'
    case 'employee': return 'Ansatt'
    default: return 'Ukjent'
  }
}

// ============================================
// STATUS HELPERS
// ============================================

/**
 * Get styling for status badge
 */
export function statusColor(status: string): ColorSet {
  switch (status) {
    case 'published':
      return {
        bg: colors.successLight,
        color: colors.success,
        border: colors.successBorder
      }
    case 'draft':
    default:
      return {
        bg: colors.warningLight,
        color: colors.warning,
        border: colors.warningBorder
      }
  }
}
