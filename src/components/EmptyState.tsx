import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { colors, shadows, radius, transitions } from '@/lib/ui-helpers'

type EmptyStateProps = {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon = <Inbox size={48} aria-hidden="true" />,
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '56px 32px',
      color: colors.textMuted,
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: colors.primarySubtle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 20px',
        color: colors.primary,
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: 17,
        fontWeight: 600,
        color: colors.text,
        marginBottom: 10,
        letterSpacing: '-0.01em',
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 14,
        lineHeight: 1.6,
        marginBottom: actionLabel ? 24 : 0,
        color: colors.textSecondary,
        maxWidth: 320,
        margin: actionLabel ? '0 auto 24px' : '0 auto',
      }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '12px 24px',
            fontSize: 14,
            fontWeight: 600,
            color: colors.primary,
            background: colors.primarySubtle,
            border: `1px solid ${colors.primaryMuted}`,
            borderRadius: radius.md,
            cursor: 'pointer',
            transition: `all ${transitions.normal}`,
            boxShadow: shadows.xs,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primary
            e.currentTarget.style.color = '#FFFFFF'
            e.currentTarget.style.boxShadow = shadows.md
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primarySubtle
            e.currentTarget.style.color = colors.primary
            e.currentTarget.style.boxShadow = shadows.xs
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
