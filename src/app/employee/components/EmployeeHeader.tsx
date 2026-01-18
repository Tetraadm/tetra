import Image from 'next/image'
import type { Profile, Organization } from '@/lib/types'

type Props = {
  profile: Profile
  organization: Organization
  isMobile: boolean
  onLogout: () => void
}

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export default function EmployeeHeader({ profile, organization, isMobile, onLogout }: Props) {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--bg-elevated)',
      borderBottom: '1px solid var(--border-subtle)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'var(--space-4) var(--space-5)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Image
            src="/tetra-logo.png"
            alt="Tetra"
            width={120}
            height={32}
            style={{ height: 32, width: 'auto' }}
          />
          {!isMobile && (
            <span style={{
              padding: 'var(--space-1) var(--space-3)',
              background: 'var(--color-primary-100)',
              color: 'var(--color-primary-700)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              border: '1px solid var(--color-primary-200)'
            }}>
              {organization.name}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {!isMobile && (
            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Hei, {profile.full_name?.split(' ')[0] || 'bruker'}
            </span>
          )}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-500))',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'transform var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onClick={onLogout}
            title="Logg ut"
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {getInitials(profile.full_name || 'U')}
          </div>
        </div>
      </div>
    </header>
  )
}
