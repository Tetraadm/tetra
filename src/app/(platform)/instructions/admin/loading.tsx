export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <div className="spinner" />
        <p style={{
          fontSize: 14,
          color: '#64748B'
        }}>
          Laster...
        </p>
      </div>
    </div>
  )
}
