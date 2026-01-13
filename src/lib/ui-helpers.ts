/**
 * Tetra HMS - UI Helper Functions
 * Nordic Enterprise Premium Design System
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
// DESIGN TOKENS - Premium Petrol Palette
// ============================================

export const colors = {
  // Primary - Deep Petrol
  primary: '#0D9488',
  primaryHover: '#0F766E',
  primaryActive: '#115E59',
  primaryMuted: '#CCFBF1',
  primarySubtle: '#F0FDFA',

  // Background & Surface
  background: '#F8FAFB',
  backgroundSubtle: '#F1F5F7',
  surface: '#FFFFFF',
  surfaceHover: '#FAFCFC',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  borderSubtle: '#F1F5F9',

  // Semantic - Danger/Critical
  danger: '#DC2626',
  dangerHover: '#B91C1C',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FECACA',

  // Semantic - Warning/High
  warning: '#D97706',
  warningHover: '#B45309',
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',

  // Semantic - High Priority (Orange)
  high: '#EA580C',
  highLight: '#FFF7ED',
  highBorder: '#FED7AA',

  // Semantic - Success/Low
  success: '#059669',
  successHover: '#047857',
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',

  // Semantic - Info
  info: '#0891B2',
  infoHover: '#0E7490',
  infoLight: '#ECFEFF',
  infoBorder: '#A5F3FC',
} as const

// ============================================
// SHADOWS - Soft with petrol tint
// ============================================

export const shadows = {
  xs: '0 1px 2px 0 rgba(13, 148, 136, 0.04)',
  sm: '0 1px 3px 0 rgba(13, 148, 136, 0.06), 0 1px 2px -1px rgba(13, 148, 136, 0.06)',
  md: '0 4px 6px -1px rgba(13, 148, 136, 0.08), 0 2px 4px -2px rgba(13, 148, 136, 0.06)',
  lg: '0 10px 15px -3px rgba(13, 148, 136, 0.08), 0 4px 6px -4px rgba(13, 148, 136, 0.06)',
  xl: '0 20px 25px -5px rgba(13, 148, 136, 0.1), 0 8px 10px -6px rgba(13, 148, 136, 0.06)',
  elevated: '0 12px 24px -4px rgba(13, 148, 136, 0.12), 0 4px 8px -2px rgba(13, 148, 136, 0.06)',
  focus: '0 0 0 3px rgba(13, 148, 136, 0.2)',
  focusDanger: '0 0 0 3px rgba(220, 38, 38, 0.2)',
} as const

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  '2xl': '24px',
  full: '9999px',
} as const

// ============================================
// TRANSITIONS
// ============================================

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
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
    case 'high': return 'Høy'
    case 'medium': return 'Middels'
    case 'low': return 'Lav'
    default: return 'Ukjent'
  }
}

/**
 * Get styling for severity badge - Premium color scheme
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
    borderRadius: radius.lg,
    boxShadow: elevated ? shadows.md : shadows.sm,
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
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: radius.full,
    whiteSpace: 'nowrap',
    letterSpacing: '0.01em',
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
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: radius.md,
    border: 'none',
    background: disabled ? colors.textMuted : colors.primary,
    color: colors.textInverse,
    boxShadow: disabled ? 'none' : shadows.sm,
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
    padding: '10px 18px',
    fontSize: '13px',
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
    padding: '10px 18px',
    fontSize: '13px',
    fontWeight: 600,
    lineHeight: 1,
    borderRadius: radius.md,
    border: 'none',
    background: disabled ? colors.textMuted : colors.danger,
    color: colors.textInverse,
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
    padding: '10px 14px',
    fontSize: '15px',
    fontFamily: 'inherit',
    color: colors.text,
    background: colors.surface,
    border: `1px solid ${hasError ? colors.danger : colors.border}`,
    borderRadius: radius.md,
    outline: 'none',
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
  }
}

/**
 * Generate glass morphism styles
 */
export function glassStyle(strong = false): React.CSSProperties {
  return {
    background: strong ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: strong ? 'blur(20px)' : 'blur(12px)',
    WebkitBackdropFilter: strong ? 'blur(20px)' : 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
  }
}
