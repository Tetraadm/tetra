import { Plus, FolderOpen, Paperclip } from 'lucide-react'
import type { Instruction, Folder } from '@/lib/types'
import { severityLabel, severityColor, statusColor } from '@/lib/ui-helpers'
import type { createAdminStyles } from '../styles'

type Props = {
  instructions: Instruction[]
  folders: Folder[]
  filteredInstructions: Instruction[]
  selectedFolder: string
  statusFilter: string
  styles: ReturnType<typeof createAdminStyles>
  setSelectedFolder: (folder: string) => void
  setStatusFilter: (status: string) => void
  toggleInstructionStatus: (instruction: Instruction) => void
  openEditInstruction: (instruction: Instruction) => void
  deleteInstruction: (id: string) => void
  deleteFolder: (id: string) => void
  setShowCreateInstruction: (show: boolean) => void
  setShowCreateFolder: (show: boolean) => void
}

export default function InstructionsTab({
  folders,
  filteredInstructions,
  selectedFolder,
  statusFilter,
  styles,
  setSelectedFolder,
  setStatusFilter,
  toggleInstructionStatus,
  openEditInstruction,
  deleteInstruction,
  deleteFolder,
  setShowCreateInstruction,
  setShowCreateFolder
}: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={styles.pageTitle}>Instrukser</h1>
          <p style={styles.pageSubtitle}>Kun publiserte instrukser er synlige for ansatte og AI</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={styles.btnSecondary} onClick={() => setShowCreateFolder(true)}>
            <FolderOpen size={16} />
            Ny mappe
          </button>
          <button style={styles.btn} onClick={() => setShowCreateInstruction(true)}>
            <Plus size={16} />
            Opprett instruks
          </button>
        </div>
      </div>

      <div style={styles.filterBar}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Filter:</span>

        <select
          style={{ ...styles.select, width: 'auto', marginBottom: 0, marginRight: 16 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">Alle statuser</option>
          <option value="published">Publisert</option>
          <option value="draft">Utkast</option>
        </select>

        <button style={styles.folderChip(selectedFolder === 'all')} onClick={() => setSelectedFolder('all')}>
          Alle mapper
        </button>
        <button style={styles.folderChip(selectedFolder === 'none')} onClick={() => setSelectedFolder('none')}>
          Uten mappe
        </button>
        {folders.map(folder => (
          <div key={folder.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <button style={styles.folderChip(selectedFolder === folder.id)} onClick={() => setSelectedFolder(folder.id)}>
              <FolderOpen size={14} style={{ marginRight: 4 }} />{folder.name}
            </button>
            <button style={{ ...styles.btnDanger, padding: '4px 8px', fontSize: 10 }} onClick={() => deleteFolder(folder.id)}>✕</button>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Tittel</th>
              <th style={styles.th}>Mappe</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Alvorlighet</th>
              <th style={styles.th}>Handlinger</th>
            </tr>
          </thead>
          <tbody>
            {filteredInstructions.map(inst => (
              <tr key={inst.id}>
                <td style={styles.td}>
                  {inst.title}
                  {inst.file_path && <Paperclip size={14} style={{ marginLeft: 8, color: '#64748B', verticalAlign: 'middle' }} />}
                </td>
                <td style={styles.td}>{inst.folders?.name || 'Ingen mappe'}</td>
                <td style={styles.td}>
                  <span style={styles.badge(statusColor(inst.status).bg, statusColor(inst.status).color)}>
                    {inst.status === 'published' ? 'Publisert' : 'Utkast'}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.badge(severityColor(inst.severity).bg, severityColor(inst.severity).color)}>
                    {severityLabel(inst.severity)}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionBtns}>
                    <button
                      style={inst.status === 'published' ? styles.btnSmall : styles.btnSuccess}
                      onClick={() => toggleInstructionStatus(inst)}
                    >
                      {inst.status === 'published' ? 'Avpubliser' : 'Publiser'}
                    </button>
                    <button style={styles.btnSmall} onClick={() => openEditInstruction(inst)}>Rediger</button>
                    <button style={styles.btnDanger} onClick={() => deleteInstruction(inst.id)}>Slett</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredInstructions.length === 0 && (
              <tr><td colSpan={5} style={{ ...styles.td, color: '#64748B' }}>Ingen instrukser funnet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
