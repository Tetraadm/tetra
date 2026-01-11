import { useEffect, useId, useRef, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import type { Folder, Instruction, Profile, Team } from '@/lib/types'
import type { createAdminStyles } from '../styles'
import type { NewInstructionState } from '../hooks/useAdminInstructions'
import type { NewAlertState } from '../hooks/useAdminAlerts'

type Styles = ReturnType<typeof createAdminStyles>

const loadingButtonStyles = (isLoading: boolean) => (
  isLoading ? { background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6 } : {}
)

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
  styles: Styles
  titleId: string
  children: ReactNode
}

function ModalShell({ open, onClose, styles, titleId, children }: ModalShellProps) {
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
    <div style={styles.modal} onClick={onClose}>
      <div
        ref={contentRef}
        style={styles.modalContent}
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
  styles: Styles
  newTeamName: string
  setNewTeamName: Dispatch<SetStateAction<string>>
  onCreate: () => void
  onClose: () => void
  loading: boolean
}

export function CreateTeamModal({
  open,
  styles,
  newTeamName,
  setNewTeamName,
  onCreate,
  onClose,
  loading
}: CreateTeamModalProps) {
  const titleId = useId()

  return (
    <ModalShell open={open} onClose={onClose} styles={styles} titleId={titleId}>
      <h2 id={titleId} style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett team</h2>
      <label style={styles.label}>Teamnavn</label>
      <input
        style={styles.input}
        value={newTeamName}
        onChange={(e) => setNewTeamName(e.target.value)}
        placeholder="F.eks. Lager, Butikk"
      />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button style={styles.btnSecondary} onClick={onClose}>Avbryt</button>
        <button
          style={{ ...styles.btn, ...loadingButtonStyles(loading) }}
          onClick={onCreate}
          disabled={loading}
        >
          {loading ? 'Oppretter...' : 'Opprett'}
        </button>
      </div>
    </ModalShell>
  )
}

type CreateFolderModalProps = {
  open: boolean
  styles: Styles
  newFolderName: string
  setNewFolderName: Dispatch<SetStateAction<string>>
  onCreate: () => void
  onClose: () => void
  loading: boolean
}

export function CreateFolderModal({
  open,
  styles,
  newFolderName,
  setNewFolderName,
  onCreate,
  onClose,
  loading
}: CreateFolderModalProps) {
  const titleId = useId()

  return (
    <ModalShell open={open} onClose={onClose} styles={styles} titleId={titleId}>
      <h2 id={titleId} style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett mappe</h2>
      <label style={styles.label}>Mappenavn</label>
      <input
        style={styles.input}
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        placeholder="F.eks. Brann, HMS"
      />
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button style={styles.btnSecondary} onClick={onClose}>Avbryt</button>
        <button
          style={{ ...styles.btn, ...loadingButtonStyles(loading) }}
          onClick={onCreate}
          disabled={loading}
        >
          {loading ? 'Oppretter...' : 'Opprett'}
        </button>
      </div>
    </ModalShell>
  )
}

type CreateInstructionModalProps = {
  open: boolean
  styles: Styles
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
  styles,
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
    <ModalShell open={open} onClose={onClose} styles={styles} titleId={titleId}>
      <h2 id={titleId} style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett instruks</h2>

      <label style={styles.label}>Tittel</label>
      <input
        style={styles.input}
        value={newInstruction.title}
        onChange={(e) => setNewInstruction({ ...newInstruction, title: e.target.value })}
        placeholder="F.eks. Brannrutiner"
      />

      <label style={styles.label}>Mappe</label>
      <select
        style={styles.select}
        value={newInstruction.folderId}
        onChange={(e) => setNewInstruction({ ...newInstruction, folderId: e.target.value })}
      >
        <option value="">Ingen mappe</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>{folder.name}</option>
        ))}
      </select>

      <label style={styles.label}>Status</label>
      <select
        style={styles.select}
        value={newInstruction.status}
        onChange={(e) => setNewInstruction({ ...newInstruction, status: e.target.value })}
      >
        <option value="draft">Utkast (ikke synlig for ansatte)</option>
        <option value="published">Publisert (synlig for ansatte og AI)</option>
      </select>

      <label style={styles.label}>
        Innhold (brukes av AI)
        <span style={{ fontSize: 12, fontWeight: 400, color: '#64748B', marginLeft: 8 }}>
          Valgfritt hvis du laster opp PDF. AI kan kun svare basert på tekst du skriver her.
        </span>
      </label>
      <textarea
        style={styles.textarea}
        value={newInstruction.content}
        onChange={(e) => setNewInstruction({ ...newInstruction, content: e.target.value })}
        placeholder="Skriv eller lim inn tekst fra PDF her for at AI skal kunne svare på spørsmål om denne instruksen..."
        rows={8}
      />

      <label style={styles.label}>Alvorlighet</label>
      <select
        style={styles.select}
        value={newInstruction.severity}
        onChange={(e) => setNewInstruction({ ...newInstruction, severity: e.target.value })}
      >
        <option value="critical">Kritisk</option>
        <option value="medium">Middels</option>
        <option value="low">Lav</option>
      </select>

      <label style={styles.label}>Vedlegg (PDF)</label>
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        style={{ marginBottom: 16 }}
      />
      {selectedFile && <p style={{ fontSize: 13, color: '#10B981', marginBottom: 16 }}>Valgt fil: {selectedFile.name}</p>}

      <label style={styles.label}>Team</label>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={newInstruction.allTeams}
            onChange={(e) => setNewInstruction({ ...newInstruction, allTeams: e.target.checked, teamIds: [] })}
          />
          <span>Alle team</span>
        </label>
        {!newInstruction.allTeams && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  const ids = newInstruction.teamIds.includes(team.id)
                    ? newInstruction.teamIds.filter((id) => id !== team.id)
                    : [...newInstruction.teamIds, team.id]
                  setNewInstruction({ ...newInstruction, teamIds: ids })
                }}
                style={styles.teamChip(newInstruction.teamIds.includes(team.id))}
              >
                {team.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button style={styles.btnSecondary} onClick={onClose}>Avbryt</button>
        <button
          style={{ ...styles.btn, ...loadingButtonStyles(instructionLoading) }}
          onClick={createInstruction}
          disabled={instructionLoading}
        >
          {instructionLoading ? 'Oppretter...' : 'Opprett'}
        </button>
      </div>
    </ModalShell>
  )
}

type EditInstructionModalProps = {
  open: boolean
  styles: Styles
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
  styles,
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
    <ModalShell open={open} onClose={onClose} styles={styles} titleId={titleId}>
      <h2 id={titleId} style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Rediger instruks</h2>

      <label style={styles.label}>Tittel</label>
      <input
        style={styles.input}
        value={editInstructionTitle}
        onChange={(e) => setEditInstructionTitle(e.target.value)}
      />

      <label style={styles.label}>Mappe</label>
      <select
        style={styles.select}
        value={editInstructionFolder}
        onChange={(e) => setEditInstructionFolder(e.target.value)}
      >
        <option value="">Ingen mappe</option>
        {folders.map((folder) => (
          <option key={folder.id} value={folder.id}>{folder.name}</option>
        ))}
      </select>

      <label style={styles.label}>Status</label>
      <select
        style={styles.select}
        value={editInstructionStatus}
        onChange={(e) => setEditInstructionStatus(e.target.value)}
      >
        <option value="draft">Utkast</option>
        <option value="published">Publisert</option>
      </select>

      <label style={styles.label}>Innhold</label>
      <textarea
        style={styles.textarea}
        value={editInstructionContent}
        onChange={(e) => setEditInstructionContent(e.target.value)}
      />

      <label style={styles.label}>Alvorlighet</label>
      <select
        style={styles.select}
        value={editInstructionSeverity}
        onChange={(e) => setEditInstructionSeverity(e.target.value)}
      >
        <option value="critical">Kritisk</option>
        <option value="medium">Middels</option>
        <option value="low">Lav</option>
      </select>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button style={styles.btnSecondary} onClick={onClose}>Avbryt</button>
        <button
          style={{ ...styles.btn, ...loadingButtonStyles(instructionLoading) }}
          onClick={saveEditInstruction}
          disabled={instructionLoading}
        >
          {instructionLoading ? 'Lagrer...' : 'Lagre'}
        </button>
      </div>
    </ModalShell>
  )
}

type InviteUserModalProps = {
  open: boolean
  styles: Styles
  inviteEmail: string
  setInviteEmail: Dispatch<SetStateAction<string>>
  inviteRole: string
  setInviteRole: Dispatch<SetStateAction<string>>
  inviteTeam: string
  setInviteTeam: Dispatch<SetStateAction<string>>
  teams: Team[]
  userLoading: boolean
  inviteUser: () => void
  onClose: () => void
}

export function InviteUserModal({
  open,
  styles,
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
    <ModalShell open={open} onClose={onClose} styles={styles} titleId={titleId}>
      <h2 id={titleId} style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Lag invitasjonslenke</h2>

      <label style={styles.label}>E-post (kun for referanse)</label>
      <input
        style={styles.input}
        type="email"
        value={inviteEmail}
        onChange={(e) => setInviteEmail(e.target.value)}
        placeholder="bruker@bedrift.no"
      />
      <p style={{ fontSize: 13, color: '#64748B', marginTop: -12, marginBottom: 16 }}>
        E-posten lagres ikke i databasen. Den brukes kun for logging og referanse.
      </p>

      <label style={styles.label}>Rolle</label>
      <select
        style={styles.select}
        value={inviteRole}
        onChange={(e) => setInviteRole(e.target.value)}
      >
        <option value="employee">Ansatt</option>
        <option value="teamleader">Teamleder</option>
        <option value="admin">Sikkerhetsansvarlig</option>
      </select>

      <label style={styles.label}>Team</label>
      <select
        style={styles.select}
        value={inviteTeam}
        onChange={(e) => setInviteTeam(e.target.value)}
      >
        <option value="">Velg team...</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>{team.name}</option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button style={styles.btnSecondary} onClick={onClose}>Avbryt</button>
        <button
          style={{ ...styles.btn, ...loadingButtonStyles(userLoading) }}
          onClick={inviteUser}
          disabled={userLoading}
        >
          {userLoading ? 'Sender...' : 'Opprett invitasjon'}
        </button>
      </div>
    </ModalShell>
  )
}

type EditUserModalProps = {
  open: boolean
  styles: Styles
  editingUser: Profile | null
  editUserRole: string
  setEditUserRole: Dispatch<SetStateAction<string>>
  editUserTeam: string
  setEditUserTeam: Dispatch<SetStateAction<string>>
  teams: Team[]
  userLoading: boolean
  saveEditUser: () => void
  onClose: () => void
}

export function EditUserModal({
  open,
  styles,
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
    <ModalShell open={open} onClose={onClose} styles={styles} titleId={titleId}>
      <h2 id={titleId} style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Rediger bruker</h2>
      <p style={{ color: '#64748B', marginBottom: 16 }}>{editingUser.full_name}</p>

      <label style={styles.label}>Rolle</label>
      <select
        style={styles.select}
        value={editUserRole}
        onChange={(e) => setEditUserRole(e.target.value)}
      >
        <option value="employee">Ansatt</option>
        <option value="teamleader">Teamleder</option>
        <option value="admin">Sikkerhetsansvarlig</option>
      </select>

      <label style={styles.label}>Team</label>
      <select
        style={styles.select}
        value={editUserTeam}
        onChange={(e) => setEditUserTeam(e.target.value)}
      >
        <option value="">Ingen team</option>
        {teams.map((team) => (
          <option key={team.id} value={team.id}>{team.name}</option>
        ))}
      </select>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button style={styles.btnSecondary} onClick={onClose}>Avbryt</button>
        <button
          style={{ ...styles.btn, ...loadingButtonStyles(userLoading) }}
          onClick={saveEditUser}
          disabled={userLoading}
        >
          {userLoading ? 'Lagrer...' : 'Lagre'}
        </button>
      </div>
    </ModalShell>
  )
}

type CreateAlertModalProps = {
  open: boolean
  styles: Styles
  newAlert: NewAlertState
  setNewAlert: Dispatch<SetStateAction<NewAlertState>>
  teams: Team[]
  alertLoading: boolean
  createAlert: () => void
  onClose: () => void
}

export function CreateAlertModal({
  open,
  styles,
  newAlert,
  setNewAlert,
  teams,
  alertLoading,
  createAlert,
  onClose
}: CreateAlertModalProps) {
  const titleId = useId()

  return (
    <ModalShell open={open} onClose={onClose} styles={styles} titleId={titleId}>
      <h2 id={titleId} style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett avvik</h2>

      <label style={styles.label}>Tittel</label>
      <input
        style={styles.input}
        value={newAlert.title}
        onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
        placeholder="F.eks. Stengt nødutgang"
      />

      <label style={styles.label}>Beskrivelse</label>
      <textarea
        style={styles.textarea}
        value={newAlert.description}
        onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
      />

      <label style={styles.label}>Alvorlighet</label>
      <select
        style={styles.select}
        value={newAlert.severity}
        onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value })}
      >
        <option value="critical">Kritisk</option>
        <option value="medium">Middels</option>
        <option value="low">Lav</option>
      </select>

      <label style={styles.label}>Synlig for</label>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={newAlert.allTeams}
            onChange={(e) => setNewAlert({ ...newAlert, allTeams: e.target.checked, teamIds: [] })}
          />
          <span>Alle team</span>
        </label>
        {!newAlert.allTeams && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  const ids = newAlert.teamIds.includes(team.id)
                    ? newAlert.teamIds.filter((id) => id !== team.id)
                    : [...newAlert.teamIds, team.id]
                  setNewAlert({ ...newAlert, teamIds: ids })
                }}
                style={styles.teamChip(newAlert.teamIds.includes(team.id))}
              >
                {team.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button style={styles.btnSecondary} onClick={onClose}>Avbryt</button>
        <button
          style={{ ...styles.btn, ...loadingButtonStyles(alertLoading) }}
          onClick={createAlert}
          disabled={alertLoading}
        >
          {alertLoading ? 'Oppretter...' : 'Opprett'}
        </button>
      </div>
    </ModalShell>
  )
}

type DisclaimerModalProps = {
  open: boolean
  styles: Styles
  onClose: () => void
}

export function DisclaimerModal({ open, styles, onClose }: DisclaimerModalProps) {
  const titleId = useId()

  if (!open) return null

  return (
    <ModalShell open={open} onClose={onClose} styles={styles} titleId={titleId}>
      <h2 id={titleId} style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Om AI-assistenten</h2>

      <div style={styles.disclaimer}>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Ansvarsfraskrivelse</h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
          Tetra AI er et <strong>støtteverktøy</strong> som hjelper ansatte med å finne informasjon i bedriftens instrukser og prosedyrer.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
          AI-assistenten svarer <strong>kun basert på publiserte dokumenter</strong> i systemet. Den bruker ikke ekstern kunnskap eller generell informasjon.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#92400E' }}>
          <strong>Viktig:</strong> AI-svar er ikke juridisk bindende eller operativ fasit. Ved tvil, kontakt alltid ansvarlig leder.
        </p>
      </div>

      <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Logging</h3>
      <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
        Alle spørsmål og svar logges for kvalitetssikring. Loggene er kun tilgjengelige for administratorer.
      </p>

      <button style={styles.btn} onClick={onClose}>Lukk</button>
    </ModalShell>
  )
}

