import { Plus, Inbox } from 'lucide-react'
import type { Profile, Team } from '@/lib/types'
import { roleLabel } from '@/lib/ui-helpers'

type Props = {
  profile: Profile
  users: Profile[]
  teams: Team[]
  openEditUser: (user: Profile) => void
  deleteUser: (userId: string) => void
  setShowInviteUser: (show: boolean) => void
  usersHasMore: boolean
  usersLoadingMore: boolean
  loadMoreUsers: () => void
}

export default function UsersTab({
  profile,
  users,
  teams,
  openEditUser,
  deleteUser,
  setShowInviteUser,
  usersHasMore,
  usersLoadingMore,
  loadMoreUsers
}: Props) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold font-serif tracking-tight text-foreground">
            Brukere
          </h1>
          <p className="text-muted-foreground">
            Administrer ansatte og teamledere
          </p>
        </div>
        <button className="nt-btn nt-btn-primary" onClick={() => setShowInviteUser(true)}>
          <Plus size={16} />
          <span>Lag invitasjonslenke</span>
        </button>
      </div>

      {users.length === 0 ? (
        <div className="nt-empty-state">
          <Inbox className="nt-empty-state__icon" />
          <h3 className="nt-empty-state__title">Ingen brukere ennå</h3>
          <p className="nt-empty-state__description">
            Kom i gang ved å invitere din første bruker. De vil motta en invitasjonslenke på e-post.
          </p>
          <button className="nt-btn nt-btn-primary" onClick={() => setShowInviteUser(true)}>
            <Plus size={16} />
            <span>Lag invitasjonslenke</span>
          </button>
        </div>
      ) : (
        <div>
          <div className="nt-table-container">
            <table className="nt-table">
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>Rolle</th>
                  <th>Team</th>
                  <th>Handlinger</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 500 }}>{user.full_name || 'Uten navn'}</td>
                    <td>{roleLabel(user.role)}</td>
                    <td>{teams.find(t => t.id === user.team_id)?.name || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="nt-btn nt-btn-secondary nt-btn-sm" onClick={() => openEditUser(user)}>
                          Rediger
                        </button>
                        {user.id !== profile.id && (
                          <button className="nt-btn nt-btn-danger nt-btn-sm" onClick={() => deleteUser(user.id)}>
                            Fjern
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {usersHasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button
                className="nt-btn nt-btn-secondary"
                onClick={loadMoreUsers}
                disabled={usersLoadingMore}
              >
                {usersLoadingMore ? 'Laster...' : 'Vis flere'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
