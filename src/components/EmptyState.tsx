type EmptyStateProps = {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '48px 24px',
      color: '#64748B'
    }}>
      <div style={{
        fontSize: 48,
        marginBottom: 16,
        opacity: 0.5
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: 16,
        fontWeight: 600,
        color: '#1E293B',
        marginBottom: 8
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 14,
        lineHeight: 1.5,
        marginBottom: actionLabel ? 20 : 0
      }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: '#2563EB',
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
