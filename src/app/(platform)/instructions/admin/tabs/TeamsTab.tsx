import { Plus, Users, Inbox } from 'lucide-react'
import type { Profile, Team } from '@/lib/types'

type Props = {
  teams: Team[]
  users: Profile[]
  deleteTeam: (teamId: string) => void
  setShowCreateTeam: (show: boolean) => void
  teamMemberCounts: Record<string, number>
  teamsHasMore: boolean
  teamsLoadingMore: boolean
  loadMoreTeams: () => void
}

export default function TeamsTab({
  teams,
  users,
  deleteTeam,
  setShowCreateTeam,
  teamMemberCounts,
  teamsHasMore,
  teamsLoadingMore,
  loadMoreTeams
}: Props) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold font-serif tracking-tight text-foreground">
            Team
          </h1>
          <p className="text-muted-foreground">
            Opprett og administrer team
          </p>
        </div>
        <button className="nt-btn nt-btn-primary" onClick={() => setShowCreateTeam(true)}>
          <Plus size={16} />
          <span>Opprett team</span>
        </button>
      </div>

      {teams.length === 0 ? (
        <div className="nt-empty-state">
          <Inbox className="nt-empty-state__icon" />
          <h3 className="nt-empty-state__title">Ingen team ennå</h3>
          <p className="nt-empty-state__description">
            Kom i gang ved å opprette ditt første team. Team hjelper deg å organisere brukere og instruksjoner.
          </p>
          <button className="nt-btn nt-btn-primary" onClick={() => setShowCreateTeam(true)}>
            <Plus size={16} />
            <span>Opprett team</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 'var(--space-5)'
        }}>
          {teams.map(team => (
            <div key={team.id} className="nt-card">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    marginBottom: 8
                  }}>
                    {team.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <Users size={14} />
                    <span>
                      {teamMemberCounts[team.id] !== undefined
                        ? teamMemberCounts[team.id]
                        : users.filter(u => u.team_id === team.id).length}
                      {' '}medlemmer
                    </span>
                  </div>
                </div>
                <button
                  className="nt-btn nt-btn-danger nt-btn-sm"
                  onClick={() => deleteTeam(team.id)}
                >
                  Slett
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {teamsHasMore && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <button
            className="nt-btn nt-btn-secondary"
            onClick={loadMoreTeams}
            disabled={teamsLoadingMore}
          >
            {teamsLoadingMore ? 'Laster...' : 'Vis flere'}
          </button>
        </div>
      )}
    </>
  )
}
