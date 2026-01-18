import { Home, FileText, MessageCircle } from 'lucide-react'

type Props = {
  tab: 'home' | 'instructions' | 'ask'
  onTabChange: (tab: 'home' | 'instructions' | 'ask') => void
}

export default function BottomNav({ tab, onTabChange }: Props) {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-elevated)',
      borderTop: '1px solid var(--border-subtle)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: 'var(--space-3) 0',
      boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
      zIndex: 100
    }}>
      <button
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: tab === 'home' ? 'var(--color-primary-600)' : 'var(--text-tertiary)',
          fontSize: '0.75rem',
          fontWeight: tab === 'home' ? 600 : 500,
          transition: 'color var(--transition-fast)'
        }}
        onClick={() => onTabChange('home')}
      >
        <Home size={24} aria-hidden="true" />
        <span>Hjem</span>
      </button>
      <button
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: tab === 'instructions' ? 'var(--color-primary-600)' : 'var(--text-tertiary)',
          fontSize: '0.75rem',
          fontWeight: tab === 'instructions' ? 600 : 500,
          transition: 'color var(--transition-fast)'
        }}
        onClick={() => onTabChange('instructions')}
      >
        <FileText size={24} aria-hidden="true" />
        <span>Instrukser</span>
      </button>
      <button
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: tab === 'ask' ? 'var(--color-primary-600)' : 'var(--text-tertiary)',
          fontSize: '0.75rem',
          fontWeight: tab === 'ask' ? 600 : 500,
          transition: 'color var(--transition-fast)'
        }}
        onClick={() => onTabChange('ask')}
      >
        <MessageCircle size={24} aria-hidden="true" />
        <span>Spør Tetra</span>
      </button>
    </nav>
  )
}
