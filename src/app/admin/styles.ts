import { severityColor, colors, shadows, radius, transitions } from '@/lib/ui-helpers'

/**
 * Tetra HMS Admin Dashboard - Premium Style System
 * Nordic Enterprise Design with Petrol accent
 */
export const createAdminStyles = (isMobile: boolean) => ({
  // ==========================================
  // LAYOUT
  // ==========================================
  container: {
    minHeight: '100vh',
    background: colors.background,
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
  },

  // ==========================================
  // HEADER
  // ==========================================
  header: {
    background: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
    padding: isMobile ? '12px 16px' : '14px 28px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky' as const,
    top: 0,
    zIndex: 20,
    boxShadow: shadows.xs,
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    background: `linear-gradient(135deg, ${colors.primaryActive} 0%, ${colors.primary} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  orgName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 16,
    fontWeight: 500,
    padding: '4px 12px',
    background: colors.backgroundSubtle,
    borderRadius: radius.full,
  },
  logoutBtn: {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    cursor: 'pointer',
    color: colors.textSecondary,
    transition: `all ${transitions.normal}`,
  },

  // ==========================================
  // MAIN LAYOUT
  // ==========================================
  main: {
    display: 'flex',
    flexDirection: isMobile ? ('column' as const) : ('row' as const),
  },

  // ==========================================
  // SIDEBAR
  // ==========================================
  sidebar: (showMobileMenu: boolean) => ({
    width: isMobile ? '100%' : 260,
    background: colors.surface,
    borderRight: isMobile ? 'none' : `1px solid ${colors.border}`,
    borderBottom: isMobile ? `1px solid ${colors.border}` : 'none',
    minHeight: isMobile ? 'auto' : 'calc(100vh - 61px)',
    padding: isMobile ? '12px 16px' : '20px 14px',
    display: isMobile && !showMobileMenu ? 'none' : 'block',
    position: isMobile ? ('relative' as const) : ('sticky' as const),
    top: isMobile ? 'auto' : 61,
    alignSelf: 'flex-start' as const,
  }),
  mobileMenuBtn: {
    display: isMobile ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    fontSize: 20,
    background: colors.backgroundSubtle,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    cursor: 'pointer',
    color: colors.textSecondary,
    transition: `all ${transitions.normal}`,
  },
  navItem: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: '11px 14px',
    fontSize: 14,
    fontWeight: active ? 600 : 500,
    color: active ? colors.primary : colors.textSecondary,
    background: active ? colors.primarySubtle : 'transparent',
    border: active ? `1px solid ${colors.primaryMuted}` : '1px solid transparent',
    borderRadius: radius.md,
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    marginBottom: 4,
  }),
  navIcon: (active: boolean) => ({
    flexShrink: 0,
    color: active ? colors.primary : colors.textMuted,
    transition: `color ${transitions.fast}`,
  }),

  // ==========================================
  // CONTENT AREA
  // ==========================================
  content: {
    flex: 1,
    padding: isMobile ? 20 : 36,
    maxWidth: isMobile ? '100%' : 'calc(100% - 260px)',
  },
  pageTitle: {
    fontSize: isMobile ? 22 : 26,
    fontWeight: 700,
    marginBottom: 6,
    color: colors.text,
    letterSpacing: '-0.02em',
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 28,
    lineHeight: 1.6,
  },

  // ==========================================
  // CARDS
  // ==========================================
  card: {
    background: colors.surface,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.sm,
    marginBottom: 20,
    overflow: 'hidden',
    transition: `box-shadow ${transitions.normal}, border-color ${transitions.normal}`,
  },
  cardHeader: {
    padding: '16px 22px',
    borderBottom: `1px solid ${colors.border}`,
    fontWeight: 600,
    fontSize: 15,
    color: colors.text,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: colors.backgroundSubtle,
    letterSpacing: '-0.01em',
  },
  cardBody: {
    padding: 22,
  },

  // ==========================================
  // STATS GRID
  // ==========================================
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
    gap: 18,
    marginBottom: 32,
  },
  statCard: {
    background: colors.surface,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    padding: 22,
    boxShadow: shadows.sm,
    transition: `all ${transitions.normal}`,
  },
  statIconBox: (variant: string) => ({
    width: 44,
    height: 44,
    borderRadius: radius.md,
    background: variant === 'danger' ? colors.dangerLight : colors.primarySubtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: variant === 'danger' ? colors.danger : colors.primary,
    marginBottom: 14,
  }),
  statValue: {
    fontSize: 32,
    fontWeight: 700,
    color: colors.text,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    fontWeight: 500,
  },

  // ==========================================
  // BUTTONS
  // ==========================================
  btn: {
    padding: '11px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: colors.textInverse,
    background: colors.primary,
    border: 'none',
    borderRadius: radius.md,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: shadows.sm,
  },
  btnSecondary: {
    padding: '11px 20px',
    fontSize: 14,
    fontWeight: 600,
    color: colors.text,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  },
  btnDanger: {
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: colors.danger,
    background: colors.dangerLight,
    border: `1px solid ${colors.dangerBorder}`,
    borderRadius: radius.sm,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  },
  btnSmall: {
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: colors.textSecondary,
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.sm,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  },
  btnSuccess: {
    padding: '7px 14px',
    fontSize: 12,
    fontWeight: 600,
    color: colors.success,
    background: colors.successLight,
    border: `1px solid ${colors.successBorder}`,
    borderRadius: radius.sm,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  },

  // ==========================================
  // TABLES
  // ==========================================
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: '13px 18px',
    fontSize: 11,
    fontWeight: 700,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    borderBottom: `1px solid ${colors.border}`,
    background: colors.backgroundSubtle,
  },
  td: {
    padding: '15px 18px',
    fontSize: 14,
    borderBottom: `1px solid ${colors.borderSubtle}`,
    color: colors.textSecondary,
  },

  // ==========================================
  // BADGES
  // ==========================================
  badge: (bg: string, textColor: string, border?: string) => ({
    display: 'inline-flex',
    alignItems: 'center',
    padding: '5px 12px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: radius.full,
    background: bg,
    color: textColor,
    border: border ? `1px solid ${border}` : 'none',
    gap: 5,
    letterSpacing: '0.02em',
    textTransform: 'uppercase' as const,
  }),

  // ==========================================
  // MODALS
  // ==========================================
  modal: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: 20,
    animation: 'fadeIn 200ms ease-out',
  },
  modalContent: {
    background: colors.surface,
    borderRadius: radius.xl,
    padding: 32,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: shadows.xl,
    animation: 'slideUp 300ms ease-out',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 24,
    color: colors.text,
    letterSpacing: '-0.02em',
  },

  // ==========================================
  // FORM ELEMENTS
  // ==========================================
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    marginBottom: 18,
    boxSizing: 'border-box' as const,
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
    outline: 'none',
    fontFamily: 'inherit',
    color: colors.text,
    background: colors.surface,
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    marginBottom: 18,
    boxSizing: 'border-box' as const,
    minHeight: 110,
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    outline: 'none',
    transition: `border-color ${transitions.fast}, box-shadow ${transitions.fast}`,
    color: colors.text,
    background: colors.surface,
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 14,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    marginBottom: 18,
    boxSizing: 'border-box' as const,
    background: colors.surface,
    cursor: 'pointer',
    outline: 'none',
    fontFamily: 'inherit',
    color: colors.text,
    transition: `border-color ${transitions.fast}`,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
    color: colors.text,
    letterSpacing: '-0.01em',
  },

  // ==========================================
  // CHIPS & FILTERS
  // ==========================================
  teamChip: (selected: boolean) => ({
    padding: '9px 16px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: radius.full,
    border: selected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
    background: selected ? colors.primarySubtle : colors.surface,
    color: selected ? colors.primary : colors.textSecondary,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  }),
  folderChip: (selected: boolean) => ({
    padding: '9px 16px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: radius.md,
    border: selected ? `2px solid ${colors.primary}` : `1px solid ${colors.border}`,
    background: selected ? colors.primarySubtle : colors.surface,
    color: selected ? colors.primary : colors.textSecondary,
    cursor: 'pointer',
    marginRight: 10,
    marginBottom: 10,
    transition: `all ${transitions.normal}`,
  }),

  // ==========================================
  // ALERTS & NOTIFICATIONS
  // ==========================================
  alertCard: (severity: string, active: boolean) => {
    const sev = severityColor(severity)
    return {
      background: active ? sev.bg : colors.backgroundSubtle,
      border: `1px solid ${active ? (sev.border || sev.color + '40') : colors.border}`,
      borderLeft: `4px solid ${active ? sev.color : colors.border}`,
      borderRadius: radius.md,
      padding: 18,
      marginBottom: 14,
      opacity: active ? 1 : 0.65,
      transition: `all ${transitions.normal}`,
    }
  },
  alertCallout: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: 18,
    borderRadius: radius.md,
    background: colors.dangerLight,
    borderLeft: `4px solid ${colors.danger}`,
    marginBottom: 28,
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    padding: 18,
    background: colors.surface,
    borderRadius: radius.lg,
    border: `1px solid ${colors.border}`,
    boxShadow: shadows.xs,
  },
  actionBtns: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap' as const,
  },

  // ==========================================
  // LOGS & MISC
  // ==========================================
  logCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: 18,
    marginBottom: 14,
    boxShadow: shadows.xs,
    transition: `box-shadow ${transitions.normal}`,
  },
  disclaimer: {
    background: colors.warningLight,
    border: `1px solid ${colors.warningBorder}`,
    borderLeft: `4px solid ${colors.warning}`,
    borderRadius: radius.md,
    padding: 18,
    marginBottom: 28,
  },
  emptyState: {
    padding: 56,
    textAlign: 'center' as const,
    color: colors.textMuted,
    fontSize: 14,
  },
})
