import { Plus } from 'lucide-react'
import type { Profile, Team } from '@/lib/types'
import { roleLabel } from '@/lib/ui-helpers'
import type { createAdminStyles } from '../styles'

type Props = {
  profile: Profile
  users: Profile[]
  teams: Team[]
  styles: ReturnType<typeof createAdminStyles>
  openEditUser: (user: Profile) => void
  deleteUser: (userId: string) => void
  setShowInviteUser: (show: boolean) => void
}

export default function UsersTab({ profile, users, teams, styles, openEditUser, deleteUser, setShowInviteUser }: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={styles.pageTitle}>Brukere</h1>
          <p style={styles.pageSubtitle}>Administrer ansatte og teamledere</p>
        </div>
        <button style={styles.btn} onClick={() => setShowInviteUser(true)}>
          <Plus size={16} />
          Lag invitasjonslenke
        </button>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Navn</th>
              <th style={styles.th}>Rolle</th>
              <th style={styles.th}>Team</th>
              <th style={styles.th}>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={styles.td}>{user.full_name || 'Uten navn'}</td>
                <td style={styles.td}>{roleLabel(user.role)}</td>
                <td style={styles.td}>{teams.find(t => t.id === user.team_id)?.name || '—'}</td>
                <td style={styles.td}>
                  <div style={styles.actionBtns}>
                    <button style={styles.btnSmall} onClick={() => openEditUser(user)}>Rediger</button>
                    {user.id !== profile.id && (
                      <button style={styles.btnDanger} onClick={() => deleteUser(user.id)}>Fjern</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
