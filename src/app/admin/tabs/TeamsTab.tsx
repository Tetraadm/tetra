import { Plus } from 'lucide-react'
import type { Profile, Team } from '@/lib/types'
import type { createAdminStyles } from '../styles'

type Props = {
  teams: Team[]
  users: Profile[]
  styles: ReturnType<typeof createAdminStyles>
  deleteTeam: (teamId: string) => void
  setShowCreateTeam: (show: boolean) => void
}

export default function TeamsTab({ teams, users, styles, deleteTeam, setShowCreateTeam }: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={styles.pageTitle}>Team</h1>
          <p style={styles.pageSubtitle}>Opprett og administrer team</p>
        </div>
        <button style={styles.btn} onClick={() => setShowCreateTeam(true)}>
          <Plus size={16} />
          Opprett team
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {teams.map(team => (
          <div key={team.id} style={styles.card}>
            <div style={styles.cardBody}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600 }}>{team.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748B' }}>
                    {users.filter(u => u.team_id === team.id).length} medlemmer
                  </p>
                </div>
                <button style={styles.btnDanger} onClick={() => deleteTeam(team.id)}>Slett</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
