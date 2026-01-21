export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <div className="spinner" />
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-tertiary)',
          marginTop: 'var(--space-3)'
        }}>
          Laster...
        </p>
      </div>
    </div>
  )
}
