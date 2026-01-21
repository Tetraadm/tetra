import { FolderOpen, Paperclip, Plus, X, FileText } from 'lucide-react'
import type { Instruction, Folder } from '@/lib/types'
import { severityLabel, severityColor, statusColor } from '@/lib/ui-helpers'

type Props = {
  instructions: Instruction[]
  folders: Folder[]
  filteredInstructions: Instruction[]
  selectedFolder: string
  statusFilter: string
  setSelectedFolder: (folder: string) => void
  setStatusFilter: (status: string) => void
  toggleInstructionStatus: (instruction: Instruction) => void
  openEditInstruction: (instruction: Instruction) => void
  deleteInstruction: (id: string) => void
  deleteFolder: (id: string) => void
  setShowCreateInstruction: (show: boolean) => void
  setShowCreateFolder: (show: boolean) => void
  instructionsHasMore: boolean
  instructionsLoadingMore: boolean
  loadMoreInstructions: () => void
}

export default function InstructionsTab({
  folders,
  filteredInstructions,
  selectedFolder,
  statusFilter,
  setSelectedFolder,
  setStatusFilter,
  toggleInstructionStatus,
  openEditInstruction,
  deleteInstruction,
  deleteFolder,
  setShowCreateInstruction,
  setShowCreateFolder,
  instructionsHasMore,
  instructionsLoadingMore,
  loadMoreInstructions
}: Props) {
  return (
    <>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-semibold font-serif tracking-tight text-foreground">
            Instrukser
          </h1>
          <p className="text-muted-foreground">
            Kun publiserte instrukser er synlige for ansatte og AI
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="nt-btn nt-btn-secondary" onClick={() => setShowCreateFolder(true)}>
            <FolderOpen size={16} />
            <span>Ny mappe</span>
          </button>
          <button className="nt-btn nt-btn-primary" onClick={() => setShowCreateInstruction(true)}>
            <Plus size={16} />
            <span>Opprett instruks</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 'var(--space-6)',
        padding: 'var(--space-4)',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        flexWrap: 'wrap'
      }}>
        <span style={{
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Filter:
        </span>

        <select
          style={{
            padding: 'var(--space-2) var(--space-3)',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            cursor: 'pointer',
            fontWeight: 500
          }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Alle statuser</option>
          <option value="published">Publisert</option>
          <option value="draft">Utkast</option>
        </select>

        <div style={{
          width: '1px',
          height: '24px',
          background: 'var(--border-default)'
        }} />

        {/* Folder Chips */}
        <button
          style={{
            padding: 'var(--space-2) var(--space-3)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: selectedFolder === 'all' ? 'var(--color-primary-700)' : 'var(--text-secondary)',
            background: selectedFolder === 'all' ? 'var(--color-primary-100)' : 'var(--bg-secondary)',
            border: selectedFolder === 'all' ? '1.5px solid var(--color-primary-300)' : '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onClick={() => setSelectedFolder('all')}
        >
          Alle mapper
        </button>
        <button
          style={{
            padding: 'var(--space-2) var(--space-3)',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: selectedFolder === 'none' ? 'var(--color-primary-700)' : 'var(--text-secondary)',
            background: selectedFolder === 'none' ? 'var(--color-primary-100)' : 'var(--bg-secondary)',
            border: selectedFolder === 'none' ? '1.5px solid var(--color-primary-300)' : '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onClick={() => setSelectedFolder('none')}
        >
          Uten mappe
        </button>
        {folders.map(folder => (
          <div key={folder.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <button
              style={{
                padding: 'var(--space-2) var(--space-3)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: selectedFolder === folder.id ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                background: selectedFolder === folder.id ? 'var(--color-primary-100)' : 'var(--bg-secondary)',
                border: selectedFolder === folder.id ? '1.5px solid var(--color-primary-300)' : '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              onClick={() => setSelectedFolder(folder.id)}
            >
              <FolderOpen size={14} />
              {folder.name}
            </button>
            <button
              className="nt-btn nt-btn-danger"
              style={{
                padding: '4px 8px',
                minWidth: 'auto'
              }}
              onClick={() => deleteFolder(folder.id)}
              aria-label={`Slett mappe ${folder.name}`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>

      {/* Instructions Table */}
      {filteredInstructions.length === 0 ? (
        <div className="nt-empty-state">
          <FileText className="nt-empty-state__icon" />
          <h3 className="nt-empty-state__title">Ingen instrukser funnet</h3>
          <p className="nt-empty-state__description">
            {statusFilter !== 'all' || selectedFolder !== 'all'
              ? 'Prøv å endre filtrene for å se flere instrukser.'
              : 'Kom i gang ved å opprette din første HMS-instruksjon. Instruksjoner kan inneholde tekst, bilder og PDF-dokumenter.'}
          </p>
          {(statusFilter !== 'all' || selectedFolder !== 'all') ? (
            <button
              className="nt-btn nt-btn-secondary"
              onClick={() => {
                setStatusFilter('all')
                setSelectedFolder('all')
              }}
            >
              Nullstill filtre
            </button>
          ) : (
            <button className="nt-btn nt-btn-primary" onClick={() => setShowCreateInstruction(true)}>
              <Plus size={16} />
              <span>Opprett instruksjon</span>
            </button>
          )}
        </div>
      ) : (
        <div>
          <div className="nt-table-container">
            <table className="nt-table">
            <thead>
              <tr>
                <th>Tittel</th>
                <th>Mappe</th>
                <th>Status</th>
                <th>Alvorlighet</th>
                <th>Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstructions.map(inst => (
                <tr key={inst.id}>
                  <td>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 500
                    }}>
                      {inst.title}
                      {inst.file_path && (
                        <Paperclip
                          size={14}
                          style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}
                          aria-label="Har vedlegg"
                        />
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {inst.folders?.name || 'Ingen mappe'}
                  </td>
                  <td>
                    <span
                      className="nt-badge"
                      style={{
                        background: statusColor(inst.status).bg,
                        color: statusColor(inst.status).color
                      }}
                    >
                      {inst.status === 'published' ? 'Publisert' : 'Utkast'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="nt-badge"
                      style={{
                        background: severityColor(inst.severity).bg,
                        color: severityColor(inst.severity).color
                      }}
                    >
                      {severityLabel(inst.severity)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        className={inst.status === 'published' ? 'nt-btn nt-btn-secondary nt-btn-sm' : 'nt-btn nt-btn-primary nt-btn-sm'}
                        onClick={() => toggleInstructionStatus(inst)}
                      >
                        {inst.status === 'published' ? 'Avpubliser' : 'Publiser'}
                      </button>
                      <button
                        className="nt-btn nt-btn-secondary nt-btn-sm"
                        onClick={() => openEditInstruction(inst)}
                      >
                        Rediger
                      </button>
                      <button
                        className="nt-btn nt-btn-danger nt-btn-sm"
                        onClick={() => deleteInstruction(inst.id)}
                      >
                        Slett
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          {instructionsHasMore && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
              <button
                className="nt-btn nt-btn-secondary"
                onClick={loadMoreInstructions}
                disabled={instructionsLoadingMore}
              >
                {instructionsLoadingMore ? 'Laster...' : 'Vis flere'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
