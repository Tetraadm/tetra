'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC',
      padding: 24
    }}>
      <div style={{
        maxWidth: 400,
        textAlign: 'center',
        background: 'white',
        padding: 32,
        borderRadius: 12,
        border: '1px solid #E2E8F0'
      }}>
        <div style={{
          fontSize: 48,
          marginBottom: 16
        }}>⚠️</div>
        <h2 style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 8
        }}>
          Noe gikk galt
        </h2>
        <p style={{
          fontSize: 14,
          color: '#64748B',
          marginBottom: 24
        }}>
          En uventet feil oppstod. Prøv å laste siden på nytt.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: 'white',
            background: '#2563EB',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer'
          }}
        >
          Prøv igjen
        </button>
      </div>
    </div>
  )
}
