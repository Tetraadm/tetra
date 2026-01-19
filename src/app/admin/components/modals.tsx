import { useEffect, useId, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Folder, Team, Instruction, type Profile, Role } from '@/lib/types'
import type { NewInstructionState } from '../hooks/useAdminInstructions'
import type { NewAlertState } from '../hooks/useAdminAlerts'

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const getFocusableElements = (container: HTMLElement | null) => (
  container ? Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)) : []
)

type ModalShellProps = {
  open: boolean
  onClose: () => void
  titleId: string
  children: ReactNode
}

function ModalShell({ open, onClose, titleId, children }: ModalShellProps) {
  const contentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const content = contentRef.current
    if (!content) return

    const focusFirst = () => {
      const focusables = getFocusableElements(content)
      const first = focusables[0] ?? content
      first.focus()
    }

    focusFirst()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') return

      const focusables = getFocusableElements(content)
      if (focusables.length === 0) {
        event.preventDefault()
        content.focus()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-4)',
        animation: 'fadeIn 200ms ease-out',
      }}
      onClick={onClose}
    >
      <div
        ref={contentRef}
        className="nt-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideUp 300ms ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

type CreateTeamModalProps = {
  open: boolean
  newTeamName: string
  setNewTeamName: Dispatch<SetStateAction<string>>
  onCreate: () => void
  onClose: () => void
  loading: boolean
}

export function CreateTeamModal({
  open,
  newTeamName,
  setNewTeamName,
  onCreate,
  onClose,
  loading
}: CreateTeamModalProps) {
  const titleId = useId()

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 'var(--space-5)',
          color: 'var(--text-primary)',
        }}
      >
        Opprett team
      </h2>
      <label className="nt-label">Teamnavn</label>
      <input
        className="nt-input"
        value={newTeamName}
        onChange={(e) => setNewTeamName(e.target.value)}
        placeholder="F.eks. Lager, Butikk"
      />
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button className="nt-btn nt-btn-secondary" onClick={onClose}>
          Avbryt
        </button>
        <button
          className="nt-btn nt-btn-primary"
          onClick={onCreate}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner spinner-sm spinner-white" />
              Oppretter...
            </>
          ) : (
            'Opprett'
          )}
        </button>
      </div>
    </ModalShell>
  )
}

type CreateFolderModalProps = {
  open: boolean
  newFolderName: string
  setNewFolderName: Dispatch<SetStateAction<string>>
  onCreate: () => void
  onClose: () => void
  loading: boolean
}

export function CreateFolderModal({
  open,
  newFolderName,
  setNewFolderName,
  onCreate,
  onClose,
  loading
}: CreateFolderModalProps) {
  const titleId = useId()

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 'var(--space-5)',
          color: 'var(--text-primary)',
        }}
      >
        Opprett mappe
      </h2>
      <label className="nt-label">Mappenavn</label>
      <input
        className="nt-input"
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        placeholder="F.eks. Brann, HMS"
      />
      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button className="nt-btn nt-btn-secondary" onClick={onClose}>
          Avbryt
        </button>
        <button
          className="nt-btn nt-btn-primary"
          onClick={onCreate}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner spinner-sm spinner-white" />
              Oppretter...
            </>
          ) : (
            'Opprett'
          )}
        </button>
      </div>
    </ModalShell>
  )
}

type CreateInstructionModalProps = {
  open: boolean
  folders: Folder[]
  teams: Team[]
  newInstruction: NewInstructionState
  selectedFile: File | null
  setNewInstruction: Dispatch<SetStateAction<NewInstructionState>>
  setSelectedFile: Dispatch<SetStateAction<File | null>>
  instructionLoading: boolean
  createInstruction: () => void
  onClose: () => void
}

export function CreateInstructionModal({
  open,
  folders,
  teams,
  newInstruction,
  selectedFile,
  setNewInstruction,
  setSelectedFile,
  instructionLoading,
  createInstruction,
  onClose
}: CreateInstructionModalProps) {
  const titleId = useId()

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 'var(--space-5)',
          color: 'var(--text-primary)',
        }}
      >
        Opprett instruks
      </h2>

      <label className="nt-label">Tittel</label>
      <input
        className="nt-input"
        value={newInstruction.title}
        onChange={(e) => setNewInstruction({ ...newInstruction, title: e.target.value })}
        placeholder="F.eks. Brannrutiner"
      />

      <label className="nt-label">Mappe</label>
      <select
        className="nt-select"
        value={newInstruction.folderId}
        onChange={(e) => setNewInstruction({ ...newInstruction, folderId: e.target.value })}
      >
        <option value="">Ingen mappe</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>{folder.name}</option>
        ))}
      </select>

      <label className="nt-label">Status</label>
      <select
        className="nt-select"
        value={newInstruction.status}
        onChange={(e) => setNewInstruction({ ...newInstruction, status: e.target.value })}
      >
        <option value="draft">Utkast (ikke synlig for ansatte)</option>
        <option value="published">Publisert (synlig for ansatte og AI)</option>
      </select>

      <label className="nt-label">
        Innhold (brukes av AI)
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 400,
          color: 'var(--text-tertiary)',
          marginLeft: 'var(--space-2)',
        }}>
          Valgfritt hvis du laster opp PDF. AI kan kun svare basert på tekst du skriver her.
        </span>
      </label>
      <textarea
        className="nt-textarea"
        value={newInstruction.content}
        onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
        placeholder="Skriv eller lim inn tekst fra PDF her for at AI skal kunne svare på spørsmål om denne instruksen..."
        rows={8}
      />

      <label className="nt-label">Alvorlighet</label>
      <select
        className="nt-select"
        value={newInstruction.severity}
        onChange={(e) => setNewInstruction({ ...newInstruction, severity: e.target.value })}
      >
        <option value="critical">Kritisk</option>
        <option value="medium">Middels</option>
        <option value="low">Lav</option>
      </select>

      <label className="nt-label">Vedlegg (PDF)</label>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        style={{
          marginBottom: 'var(--space-4)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}
      />
      {selectedFile && (
        <p style={{
          fontSize: '0.8125rem',
          color: 'var(--color-success-700)',
          marginBottom: 'var(--space-4)',
          fontWeight: 500,
        }}>
          Valgt fil: {selectedFile.name}
        </p>
      )}

      <label className="nt-label">Team</label>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          marginBottom: 'var(--space-3)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
        }}>
          <input
            type="checkbox"
            checked={newInstruction.allTeams}
            onChange={(e) => setNewInstruction({ ...newInstruction, allTeams: e.target.checked, teamIds: [] })}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer',
            }}
          />
          <span>Alle team</span>
        </label>
        {!newInstruction.allTeams && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {teams.map((team) => {
              const isSelected = newInstruction.teamIds.includes(team.id)
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    const ids = isSelected
                      ? newInstruction.teamIds.filter((id) => id !== team.id)
                      : [...newInstruction.teamIds, team.id]
                    setNewInstruction({ ...newInstruction, teamIds: ids })
                  }}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    border: isSelected
                      ? '2px solid var(--color-primary-600)'
                      : '1px solid var(--border-primary)',
                    background: isSelected
                      ? 'var(--color-primary-100)'
                      : 'var(--bg-elevated)',
                    color: isSelected
                      ? 'var(--color-primary-700)'
                      : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {team.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button className="nt-btn nt-btn-secondary" onClick={onClose}>
          Avbryt
        </button>
        <button
          className="nt-btn nt-btn-primary"
          onClick={createInstruction}
          disabled={instructionLoading}
        >
          {instructionLoading ? (
            <>
              <div className="spinner spinner-sm spinner-white" />
              Oppretter...
            </>
          ) : (
            'Opprett'
          )}
        </button>
      </div>
    </ModalShell>
  )
}

type EditInstructionModalProps = {
  open: boolean
  folders: Folder[]
  editingInstruction: Instruction | null
  editInstructionTitle: string
  setEditInstructionTitle: Dispatch<SetStateAction<string>>
  editInstructionContent: string
  setEditInstructionContent: Dispatch<SetStateAction<string>>
  editInstructionSeverity: string
  setEditInstructionSeverity: Dispatch<SetStateAction<string>>
  editInstructionStatus: string
  setEditInstructionStatus: Dispatch<SetStateAction<string>>
  editInstructionFolder: string
  setEditInstructionFolder: Dispatch<SetStateAction<string>>
  instructionLoading: boolean
  saveEditInstruction: () => void
  onClose: () => void
}

export function EditInstructionModal({
  open,
  folders,
  editingInstruction,
  editInstructionTitle,
  setEditInstructionTitle,
  editInstructionContent,
  setEditInstructionContent,
  editInstructionSeverity,
  setEditInstructionSeverity,
  editInstructionStatus,
  setEditInstructionStatus,
  editInstructionFolder,
  setEditInstructionFolder,
  instructionLoading,
  saveEditInstruction,
  onClose
}: EditInstructionModalProps) {
  const titleId = useId()

  if (!open || !editingInstruction) return null

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 'var(--space-5)',
          color: 'var(--text-primary)',
        }}
      >
        Rediger instruks
      </h2>

      <label className="nt-label">Tittel</label>
      <input
        className="nt-input"
        value={editInstructionTitle}
        onChange={(e) => setEditInstructionTitle(e.target.value)}
      />

      <label className="nt-label">Mappe</label>
      <select
        className="nt-select"
        value={editInstructionFolder}
        onChange={(e) => setEditInstructionFolder(e.target.value)}
      >
        <option value="">Ingen mappe</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>{folder.name}</option>
        ))}
      </select>

      <label className="nt-label">Status</label>
      <select
        className="nt-select"
        value={editInstructionStatus}
        onChange={(e) => setEditInstructionStatus(e.target.value)}
      >
        <option value="draft">Utkast</option>
        <option value="published">Publisert</option>
      </select>

      <label className="nt-label">Innhold</label>
      <textarea
        className="nt-textarea"
        value={editInstructionContent}
        onChange={(e) => setEditInstructionContent(e.target.value)}
        rows={8}
      />

      <label className="nt-label">Alvorlighet</label>
      <select
        className="nt-select"
        value={editInstructionSeverity}
        onChange={(e) => setEditInstructionSeverity(e.target.value)}
      >
        <option value="critical">Kritisk</option>
        <option value="medium">Middels</option>
        <option value="low">Lav</option>
      </select>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button className="nt-btn nt-btn-secondary" onClick={onClose}>
          Avbryt
        </button>
        <button
          className="nt-btn nt-btn-primary"
          onClick={saveEditInstruction}
          disabled={instructionLoading}
        >
          {instructionLoading ? (
            <>
              <div className="spinner spinner-sm spinner-white" />
              Lagrer...
            </>
          ) : (
            'Lagre'
          )}
        </button>
      </div>
    </ModalShell>
  )
}

type InviteUserModalProps = {
  open: boolean
  inviteEmail: string
  setInviteEmail: Dispatch<SetStateAction<string>>
  inviteRole: Role
  setInviteRole: Dispatch<SetStateAction<Role>>
  inviteTeam: string
  setInviteTeam: Dispatch<SetStateAction<string>>
  teams: Team[]
  userLoading: boolean
  inviteUser: () => void
  onClose: () => void
}

export function InviteUserModal({
  open,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteTeam,
  setInviteTeam,
  teams,
  userLoading,
  inviteUser,
  onClose
}: InviteUserModalProps) {
  const titleId = useId()

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 'var(--space-5)',
          color: 'var(--text-primary)',
        }}
      >
        Lag invitasjonslenke
      </h2>

      <label className="nt-label">E-post (kun for referanse)</label>
      <input
        className="nt-input"
        type="email"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
        placeholder="bruker@bedrift.no"
      />
      <p style={{
        fontSize: '0.8125rem',
        color: 'var(--text-tertiary)',
        marginTop: 'calc(var(--space-3) * -1)',
        marginBottom: 'var(--space-4)',
      }}>
        E-posten lagres ikke i databasen. Den brukes kun for logging og referanse.
      </p>

      <label className="nt-label">Rolle</label>
      <select
        className="nt-select"
        value={inviteRole}
        onChange={(e) => setInviteRole(e.target.value as Role)}
      >
        <option value="employee">Ansatt</option>
        <option value="teamleader">Teamleder</option>
        <option value="admin">Sikkerhetsansvarlig</option>
      </select>

      <label className="nt-label">Team</label>
      <select
        className="nt-select"
        value={inviteTeam}
        onChange={(e) => setInviteTeam(e.target.value)}
      >
        <option value="">Velg team...</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>{team.name}</option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button className="nt-btn nt-btn-secondary" onClick={onClose}>
          Avbryt
        </button>
        <button
          className="nt-btn nt-btn-primary"
          onClick={inviteUser}
          disabled={userLoading}
        >
          {userLoading ? (
            <>
              <div className="spinner spinner-sm spinner-white" />
              Sender...
            </>
          ) : (
            'Opprett invitasjon'
          )}
        </button>
      </div>
    </ModalShell>
  )
}

type EditUserModalProps = {
  open: boolean
  editingUser: Profile | null
  editUserRole: Role
  setEditUserRole: Dispatch<SetStateAction<Role>>
  editUserTeam: string
  setEditUserTeam: Dispatch<SetStateAction<string>>
  teams: Team[]
  userLoading: boolean
  saveEditUser: () => void
  onClose: () => void
}

export function EditUserModal({
  open,
  editingUser,
  editUserRole,
  setEditUserRole,
  editUserTeam,
  setEditUserTeam,
  teams,
  userLoading,
  saveEditUser,
  onClose
}: EditUserModalProps) {
  const titleId = useId()

  if (!open || !editingUser) return null

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 'var(--space-5)',
          color: 'var(--text-primary)',
        }}
      >
        Rediger bruker
      </h2>
      <p style={{
        color: 'var(--text-tertiary)',
        marginBottom: 'var(--space-4)',
        fontSize: '0.875rem',
      }}>
        {editingUser.full_name}
      </p>

      <label className="nt-label">Rolle</label>
      <select
        className="nt-select"
        value={editUserRole}
        onChange={(e) => setEditUserRole(e.target.value as Role)}
      >
        <option value="employee">Ansatt</option>
        <option value="teamleader">Teamleder</option>
        <option value="admin">Sikkerhetsansvarlig</option>
      </select>

      <label className="nt-label">Team</label>
      <select
        className="nt-select"
        value={editUserTeam}
        onChange={(e) => setEditUserTeam(e.target.value)}
      >
        <option value="">Ingen team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>{team.name}</option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button className="nt-btn nt-btn-secondary" onClick={onClose}>
          Avbryt
        </button>
        <button
          className="nt-btn nt-btn-primary"
          onClick={saveEditUser}
          disabled={userLoading}
        >
          {userLoading ? (
            <>
              <div className="spinner spinner-sm spinner-white" />
              Lagrer...
            </>
          ) : (
            'Lagre'
          )}
        </button>
      </div>
    </ModalShell>
  )
}

type CreateAlertModalProps = {
  open: boolean
  newAlert: NewAlertState
  setNewAlert: Dispatch<SetStateAction<NewAlertState>>
  teams: Team[]
  alertLoading: boolean
  createAlert: () => void
  onClose: () => void
}

export function CreateAlertModal({
  open,
  newAlert,
  setNewAlert,
  teams,
  alertLoading,
  createAlert,
  onClose
}: CreateAlertModalProps) {
  const titleId = useId()

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 'var(--space-5)',
          color: 'var(--text-primary)',
        }}
      >
        Opprett avvik
      </h2>

      <label className="nt-label">Tittel</label>
      <input
        className="nt-input"
        value={newAlert.title}
        onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
        placeholder="F.eks. Stengt nødutgang"
      />

      <label className="nt-label">Beskrivelse</label>
      <textarea
        className="nt-textarea"
        value={newAlert.description}
        onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
        rows={4}
      />

      <label className="nt-label">Alvorlighet</label>
      <select
        className="nt-select"
        value={newAlert.severity}
        onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
      >
        <option value="critical">Kritisk</option>
        <option value="medium">Middels</option>
        <option value="low">Lav</option>
      </select>

      <label className="nt-label">Synlig for</label>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          marginBottom: 'var(--space-3)',
        }}>
          <input
            type="checkbox"
            checked={newAlert.allTeams}
            onChange={(e) => setNewAlert({ ...newAlert, allTeams: e.target.checked, teamIds: [] })}
            style={{
              width: '16px',
              height: '16px',
              cursor: 'pointer',
            }}
          />
          <span>Alle team</span>
        </label>
        {!newAlert.allTeams && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {teams.map((team) => {
              const isSelected = newAlert.teamIds.includes(team.id)
              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => {
                    const ids = isSelected
                      ? newAlert.teamIds.filter((id) => id !== team.id)
                      : [...newAlert.teamIds, team.id]
                    setNewAlert({ ...newAlert, teamIds: ids })
                  }}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-full)',
                    border: isSelected
                      ? '2px solid var(--color-primary-600)'
                      : '1px solid var(--border-primary)',
                    background: isSelected
                      ? 'var(--color-primary-100)'
                      : 'var(--bg-elevated)',
                    color: isSelected
                      ? 'var(--color-primary-700)'
                      : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                  }}
                >
                  {team.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
        <button className="nt-btn nt-btn-secondary" onClick={onClose}>
          Avbryt
        </button>
        <button
          className="nt-btn nt-btn-primary"
          onClick={createAlert}
          disabled={alertLoading}
        >
          {alertLoading ? (
            <>
              <div className="spinner spinner-sm spinner-white" />
              Oppretter...
            </>
          ) : (
            'Opprett'
          )}
        </button>
      </div>
    </ModalShell>
  )
}

type DisclaimerModalProps = {
  open: boolean
  onClose: () => void
}

export function DisclaimerModal({ open, onClose }: DisclaimerModalProps) {
  const titleId = useId()

  if (!open) return null

  return (
    <ModalShell open={open} onClose={onClose} titleId={titleId}>
      <h2
        id={titleId}
        style={{
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          marginBottom: 'var(--space-5)',
          color: 'var(--text-primary)',
        }}
      >
        Om AI-assistenten
      </h2>

      <div
        style={{
          background: 'linear-gradient(135deg, var(--color-warning-50), var(--color-warning-100))',
          border: '2px solid var(--color-warning-200)',
          borderLeft: '4px solid var(--color-warning-600)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <h3 style={{
          fontWeight: 600,
          marginBottom: 'var(--space-2)',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
        }}>
          Ansvarsfraskrivelse
        </h3>
        <p style={{
          fontSize: '0.875rem',
          lineHeight: 1.6,
          marginBottom: 'var(--space-3)',
          color: 'var(--text-secondary)',
        }}>
          Tetra AI er et <strong>støtteverktøy</strong> som hjelper ansatte med å finne informasjon i bedriftens instrukser og prosedyrer.
        </p>
        <p style={{
          fontSize: '0.875rem',
          lineHeight: 1.6,
          marginBottom: 'var(--space-3)',
          color: 'var(--text-secondary)',
        }}>
          AI-assistenten svarer <strong>kun basert på publiserte dokumenter</strong> i systemet. Den bruker ikke ekstern kunnskap eller generell informasjon.
        </p>
        <p style={{
          fontSize: '0.875rem',
          lineHeight: 1.6,
          color: 'var(--color-warning-800)',
        }}>
          <strong>Viktig:</strong> AI-svar er ikke juridisk bindende eller operativ fasit. Ved tvil, kontakt alltid ansvarlig leder.
        </p>
      </div>

      <h3 style={{
        fontWeight: 600,
        marginBottom: 'var(--space-2)',
        color: 'var(--text-primary)',
        fontSize: '0.9375rem',
      }}>
        Logging
      </h3>
      <p style={{
        fontSize: '0.875rem',
        lineHeight: 1.6,
        marginBottom: 'var(--space-5)',
        color: 'var(--text-secondary)',
      }}>
        Alle spørsmål og svar logges for kvalitetssikring. Loggene er kun tilgjengelige for administratorer.
      </p>

      <button className="nt-btn nt-btn-primary" onClick={onClose} style={{ width: '100%' }}>
        Lukk
      </button>
    </ModalShell>
  )
}
