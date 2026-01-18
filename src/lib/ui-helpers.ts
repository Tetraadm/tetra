/**
 * Tetra HMS - UI Helper Functions
 * Nordic Aurora Design System
 *
 * Shared utilities for severity, role labels, colors, and styling
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

export type SeverityType = 'critical' | 'high' | 'medium' | 'low'
export type RoleType = 'admin' | 'teamleader' | 'employee'
export type StatusType = 'published' | 'draft' | 'archived'

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
    case 'high': return 'Hoy'
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
    case 'high':
      return {
        bg: colors.highLight,
        color: colors.high,
        border: colors.highBorder
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

/**
 * Get severity icon indicator style (for dots/bullets)
 */
export function severityIndicator(severity: string): string {
  switch (severity) {
    case 'critical': return colors.danger
    case 'high': return colors.high
    case 'medium': return colors.warning
    case 'low':
    default: return colors.success
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

/**
 * Get styling for role badge
 */
export function roleColor(role: string): ColorSet {
  switch (role) {
    case 'admin':
      return {
        bg: colors.primarySubtle,
        color: colors.primary,
        border: colors.primaryMuted
      }
    case 'teamleader':
      return {
        bg: colors.infoLight,
        color: colors.info,
        border: colors.infoBorder
      }
    case 'employee':
    default:
      return {
        bg: colors.backgroundSubtle,
        color: colors.textSecondary,
        border: colors.border
      }
  }
}

// ============================================
// STATUS HELPERS
// ============================================

/**
 * Convert status value to Norwegian label
 */
export function statusLabel(status: string): string {
  switch (status) {
    case 'published': return 'Publisert'
    case 'draft': return 'Utkast'
    case 'archived': return 'Arkivert'
    default: return 'Ukjent'
  }
}

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
      return {
        bg: colors.warningLight,
        color: colors.warning,
        border: colors.warningBorder
      }
    case 'archived':
      return {
        bg: colors.backgroundSubtle,
        color: colors.textMuted,
        border: colors.border
      }
    default:
      return {
        bg: colors.backgroundSubtle,
        color: colors.textSecondary,
        border: colors.border
      }
  }
}

// ============================================
// COMMON STYLE GENERATORS
// ============================================

/**
 * Generate card styles with optional hover effect
 */
export function cardStyle(elevated = false): React.CSSProperties {
  return {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.xl,
    boxShadow: elevated ? shadows.lg : shadows.md,
    transition: `all ${transitions.normal}`,
  }
}

/**
 * Generate badge styles for a given color set
 */
export function badgeStyle(colorSet: ColorSet): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 8px',
    fontSize: '10px',
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: radius.sm,
    whiteSpace: 'nowrap',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    background: colorSet.bg,
    color: colorSet.color,
    border: colorSet.border ? `1px solid ${colorSet.border}` : 'none',
  }
}

/**
 * Generate primary button styles
 */
export function primaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: radius.md,
    border: 'none',
    background: disabled ? colors.textMuted : colors.primary,
    color: colors.textInverse,
    boxShadow: disabled ? 'none' : shadows.glow,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `all ${transitions.normal}`,
  }
}

/**
 * Generate secondary button styles
 */
export function secondaryButtonStyle(disabled = false): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `all ${transitions.normal}`,
  }
}

/**
 * Generate danger button styles
 */
export function dangerButtonStyle(disabled = false): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: radius.md,
    border: `1px solid ${colors.dangerBorder}`,
    background: colors.dangerLight,
    color: colors.danger,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `all ${transitions.normal}`,
  }
}

/**
 * Generate input field styles
 */
export function inputStyle(hasError = false): React.CSSProperties {
  return {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    fontFamily: 'inherit',
    color: colors.text,
    background: colors.backgroundSubtle,
    border: `1px solid ${hasError ? colors.danger : colors.border}`,
    borderRadius: radius.md,
    outline: 'none',
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
  }
}

/**
 * Generate glass morphism styles (Nordic Aurora)
 */
export function glassStyle(strong = false): React.CSSProperties {
  return {
    background: strong ? 'rgba(20, 26, 46, 0.8)' : 'rgba(20, 26, 46, 0.5)',
    backdropFilter: strong ? 'blur(24px) saturate(180%)' : 'blur(12px)',
    WebkitBackdropFilter: strong ? 'blur(24px) saturate(180%)' : 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
  }
}
