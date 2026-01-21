/**
 * Tetrivo HMS - UI Helper Functions
 * Nordic Secure Design System
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
  // Primary - Nordic Secure
  primary: 'var(--primary)',
  primaryHover: 'var(--primary-strong)',
  primaryActive: 'var(--primary-strong)',
  primaryMuted: 'var(--primary-muted)',
  primarySubtle: 'var(--primary-subtle)',

  // Background & Surface
  background: 'var(--background)',
  backgroundSubtle: 'var(--surface-muted)',
  surface: 'var(--surface)',
  surfaceHover: 'var(--surface-strong)',

  // Text
  text: 'var(--foreground)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textInverse: 'var(--text-inverse)',

  // Borders
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
  borderSubtle: 'var(--border-subtle)',

  // Semantic - Danger/Critical
  danger: 'var(--danger)',
  dangerHover: 'var(--danger-hover)',
  dangerLight: 'var(--danger-soft)',
  dangerBorder: 'var(--danger-border)',

  // Semantic - Warning/High
  warning: 'var(--warning)',
  warningHover: 'var(--warning-hover)',
  warningLight: 'var(--warning-soft)',
  warningBorder: 'var(--warning-border)',

  // Semantic - High Priority (Orange)
  high: 'var(--high)',
  highLight: 'var(--high-soft)',
  highBorder: 'var(--high-border)',

  // Semantic - Success/Low
  success: 'var(--success)',
  successHover: 'var(--success-hover)',
  successLight: 'var(--success-soft)',
  successBorder: 'var(--success-border)',

  // Semantic - Info
  info: 'var(--info)',
  infoHover: 'var(--info-hover)',
  infoLight: 'var(--info-soft)',
  infoBorder: 'var(--info-border)',

  // Accent colors
  auroraGreen: 'var(--primary)',
  auroraViolet: 'var(--accent)',
  auroraBlue: 'var(--info)',
  auroraPink: 'var(--high)',
} as const

// ============================================
// SHADOWS - Aurora glow effects
// ============================================

export const shadows = {
  xs: '0 1px 2px rgba(15, 23, 42, 0.08)',
  sm: '0 4px 12px rgba(15, 23, 42, 0.12)',
  md: '0 8px 20px rgba(15, 23, 42, 0.16)',
  lg: '0 16px 32px rgba(15, 23, 42, 0.2)',
  xl: '0 24px 48px rgba(15, 23, 42, 0.24)',
  elevated: '0 18px 40px rgba(15, 23, 42, 0.22)',
  focus: '0 0 0 3px color-mix(in oklch, var(--primary) 25%, transparent)',
  focusDanger: '0 0 0 3px color-mix(in oklch, var(--danger) 25%, transparent)',
  glow: '0 0 30px color-mix(in oklch, var(--primary) 20%, transparent)',
  glowViolet: '0 0 30px color-mix(in oklch, var(--accent) 20%, transparent)',
} as const

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
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
