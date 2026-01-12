'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Check initial state
    setIsOffline(!navigator.onLine)

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#FEF2F2',
      borderBottom: '2px solid #FCA5A5',
      padding: '12px 20px',
      textAlign: 'center',
      zIndex: 9999,
      fontSize: 14,
      fontWeight: 600,
      color: '#DC2626',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12
    }}>
      <AlertTriangle size={16} aria-hidden="true" />
      <span>Du er offline. Noen funksjoner kan være utilgjengelige.</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 600,
          color: '#DC2626',
          background: 'white',
          border: '1px solid #FCA5A5',
          borderRadius: 6,
          cursor: 'pointer',
          marginLeft: 8
        }}
      >
        Prøv igjen
      </button>
    </div>
  )
}
