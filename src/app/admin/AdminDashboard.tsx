'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Profile = {
  id: string
  full_name: string
  role: string
  org_id: string
  team_id: string | null
}

type Organization = {
  id: string
  name: string
}

type Team = {
  id: string
  name: string
  org_id: string
}

type Instruction = {
  id: string
  title: string
  content: string | null
  severity: string
  status: string
  folder_id: string | null
  file_url: string | null
  folders: { name: string } | null
}

type Folder = {
  id: string
  name: string
}

type Alert = {
  id: string
  title: string
  description: string | null
  severity: string
  active: boolean
  created_at: string
}

type AiLog = {
  id: string
  question: string
  answer: string
  created_at: string
  instructions: { title: string } | null
}

type Props = {
  profile: Profile
  organization: Organization
  teams: Team[]
  users: Profile[]
  instructions: Instruction[]
  folders: Folder[]
  alerts: Alert[]
  aiLogs: AiLog[]
}

export default function AdminDashboard({ 
  profile, 
  organization, 
  teams: initialTeams, 
  users: initialUsers,
  instructions: initialInstructions,
  folders: initialFolders,
  alerts: initialAlerts,
  aiLogs
}: Props) {
  const [tab, setTab] = useState<'oversikt' | 'brukere' | 'team' | 'instrukser' | 'avvik' | 'ailogg' | 'innsikt'>('oversikt')
  const [teams, setTeams] = useState(initialTeams)
  const [users, setUsers] = useState(initialUsers)
  const [instructions, setInstructions] = useState(initialInstructions)
  const [folders, setFolders] = useState(initialFolders)
  const [alerts, setAlerts] = useState(initialAlerts)
  
  // Modal states
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showCreateInstruction, setShowCreateInstruction] = useState(false)
  const [showInviteUser, setShowInviteUser] = useState(false)
  const [showCreateAlert, setShowCreateAlert] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [showEditInstruction, setShowEditInstruction] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  
  // Form states
  const [newTeamName, setNewTeamName] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newInstruction, setNewInstruction] = useState({ 
    title: '', 
    content: '', 
    severity: 'medium',
    status: 'draft',
    folderId: '',
    teamIds: [] as string[],
    allTeams: false
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('employee')
  const [inviteTeam, setInviteTeam] = useState('')
  const [newAlert, setNewAlert] = useState({
    title: '',
    description: '',
    severity: 'medium',
    teamIds: [] as string[],
    allTeams: true
  })
  
  // Edit states
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null)
  const [editUserRole, setEditUserRole] = useState('')
  const [editUserTeam, setEditUserTeam] = useState('')
  const [editInstructionTitle, setEditInstructionTitle] = useState('')
  const [editInstructionContent, setEditInstructionContent] = useState('')
  const [editInstructionSeverity, setEditInstructionSeverity] = useState('')
  const [editInstructionStatus, setEditInstructionStatus] = useState('')
  const [editInstructionFolder, setEditInstructionFolder] = useState('')
  
  // Filter state
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const createTeam = async () => {
    if (!newTeamName.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('teams')
      .insert({ name: newTeamName, org_id: profile.org_id })
      .select()
      .single()

    if (!error && data) {
      setTeams([...teams, data])
      setNewTeamName('')
      setShowCreateTeam(false)
    }
    setLoading(false)
  }

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette teamet?')) return
    
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)

    if (!error) {
      setTeams(teams.filter(t => t.id !== teamId))
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('folders')
      .insert({ name: newFolderName, org_id: profile.org_id })
      .select()
      .single()

    if (!error && data) {
      setFolders([...folders, data])
      setNewFolderName('')
      setShowCreateFolder(false)
    }
    setLoading(false)
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Slette mappen? Instrukser i mappen beholdes.')) return
    
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', folderId)

    if (!error) {
      setFolders(folders.filter(f => f.id !== folderId))
      setInstructions(instructions.map(i => 
        i.folder_id === folderId ? { ...i, folder_id: null, folders: null } : i
      ))
    }
  }

  const createInstruction = async () => {
    if (!newInstruction.title.trim()) return
    setLoading(true)

    try {
      const teamIdsToLink = newInstruction.allTeams 
        ? teams.map(t => t.id) 
        : newInstruction.teamIds

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', newInstruction.title)
        formData.append('severity', newInstruction.severity)
        formData.append('status', newInstruction.status)
        formData.append('orgId', profile.org_id)
        formData.append('userId', profile.id)
        formData.append('teamIds', JSON.stringify(teamIdsToLink))
        formData.append('allTeams', newInstruction.allTeams.toString())
        if (newInstruction.folderId) {
          formData.append('folderId', newInstruction.folderId)
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.error) {
          alert(result.error)
          setLoading(false)
          return
        }

        if (result.instruction) {
          const folder = folders.find(f => f.id === newInstruction.folderId)
          setInstructions([{ 
            ...result.instruction, 
            folders: folder ? { name: folder.name } : null 
          }, ...instructions])
        }
      } else {
        const { data, error } = await supabase
          .from('instructions')
          .insert({
            title: newInstruction.title,
            content: newInstruction.content,
            severity: newInstruction.severity,
            status: newInstruction.status,
            org_id: profile.org_id,
            created_by: profile.id,
            folder_id: newInstruction.folderId || null
          })
          .select('*, folders(*)')
          .single()

        if (error) {
          alert('Kunne ikke opprette instruks')
          setLoading(false)
          return
        }

        if (data && teamIdsToLink.length > 0) {
          await supabase.from('instruction_teams').insert(
            teamIdsToLink.map(teamId => ({
              instruction_id: data.id,
              team_id: teamId
            }))
          )
        }

        if (data) {
          setInstructions([data, ...instructions])
        }
      }

      setNewInstruction({ title: '', content: '', severity: 'medium', status: 'draft', folderId: '', teamIds: [], allTeams: false })
      setSelectedFile(null)
      setShowCreateInstruction(false)
    } catch (error) {
      console.error('Error:', error)
      alert('Noe gikk galt')
    }

    setLoading(false)
  }

  const deleteInstruction = async (instructionId: string) => {
    if (!confirm('Slette instruksen? Dette fjerner også tilhørende data.')) return

    const { error } = await supabase
      .from('instructions')
      .delete()
      .eq('id', instructionId)

    if (!error) {
      setInstructions(instructions.filter(i => i.id !== instructionId))
    }
  }

  const toggleInstructionStatus = async (instruction: Instruction) => {
    const newStatus = instruction.status === 'published' ? 'draft' : 'published'
    
    const { error } = await supabase
      .from('instructions')
      .update({ status: newStatus })
      .eq('id', instruction.id)

    if (!error) {
      setInstructions(instructions.map(i => 
        i.id === instruction.id ? { ...i, status: newStatus } : i
      ))
    }
  }

  const openEditInstruction = (instruction: Instruction) => {
    setEditingInstruction(instruction)
    setEditInstructionTitle(instruction.title)
    setEditInstructionContent(instruction.content || '')
    setEditInstructionSeverity(instruction.severity)
    setEditInstructionStatus(instruction.status)
    setEditInstructionFolder(instruction.folder_id || '')
    setShowEditInstruction(true)
  }

  const saveEditInstruction = async () => {
    if (!editingInstruction) return
    setLoading(true)

    const { data, error } = await supabase
      .from('instructions')
      .update({
        title: editInstructionTitle,
        content: editInstructionContent,
        severity: editInstructionSeverity,
        status: editInstructionStatus,
        folder_id: editInstructionFolder || null
      })
      .eq('id', editingInstruction.id)
      .select('*, folders(*)')
      .single()

    if (!error && data) {
      setInstructions(instructions.map(i => 
        i.id === editingInstruction.id ? data : i
      ))
      setShowEditInstruction(false)
      setEditingInstruction(null)
    }
    setLoading(false)
  }

  const deleteUser = async (userId: string) => {
    if (userId === profile.id) {
      alert('Du kan ikke slette deg selv')
      return
    }
    if (!confirm('Fjerne denne brukeren?')) return

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (!error) {
      setUsers(users.filter(u => u.id !== userId))
    }
  }

  const openEditUser = (user: Profile) => {
    setEditingUser(user)
    setEditUserRole(user.role)
    setEditUserTeam(user.team_id || '')
    setShowEditUser(true)
  }

  const saveEditUser = async () => {
    if (!editingUser) return
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        role: editUserRole,
        team_id: editUserTeam || null
      })
      .eq('id', editingUser.id)

    if (!error) {
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, role: editUserRole, team_id: editUserTeam || null }
          : u
      ))
      setShowEditUser(false)
      setEditingUser(null)
    }
    setLoading(false)
  }

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return
    setLoading(true)

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error } = await supabase
      .from('invites')
      .insert({
        email: inviteEmail,
        role: inviteRole,
        team_id: inviteTeam || null,
        org_id: profile.org_id,
        token,
        expires_at: expiresAt.toISOString()
      })

    if (!error) {
      const inviteUrl = `${window.location.origin}/invite/${token}`
      navigator.clipboard.writeText(inviteUrl)
      alert(`Invitasjonslenke kopiert!\n\n${inviteUrl}`)
      setInviteEmail('')
      setInviteRole('employee')
      setInviteTeam('')
      setShowInviteUser(false)
    }
    setLoading(false)
  }

  const createAlert = async () => {
    if (!newAlert.title.trim()) return
    setLoading(true)

    const { data, error } = await supabase
      .from('alerts')
      .insert({
        title: newAlert.title,
        description: newAlert.description,
        severity: newAlert.severity,
        org_id: profile.org_id,
        created_by: profile.id,
        active: true
      })
      .select()
      .single()

    if (!error && data) {
      const teamIdsToLink = newAlert.allTeams 
        ? teams.map(t => t.id) 
        : newAlert.teamIds

      if (teamIdsToLink.length > 0) {
        await supabase.from('alert_teams').insert(
          teamIdsToLink.map(teamId => ({
            alert_id: data.id,
            team_id: teamId
          }))
        )
      }
      
      setAlerts([data, ...alerts])
      setNewAlert({ title: '', description: '', severity: 'medium', teamIds: [], allTeams: true })
      setShowCreateAlert(false)
    }
    setLoading(false)
  }

  const toggleAlert = async (alertId: string, active: boolean) => {
    const { error } = await supabase
      .from('alerts')
      .update({ active: !active })
      .eq('id', alertId)

    if (!error) {
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, active: !active } : a))
    }
  }

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Slette dette avviket?')) return

    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)

    if (!error) {
      setAlerts(alerts.filter(a => a.id !== alertId))
    }
  }

  const severityLabel = (s: string) => {
    if (s === 'critical') return 'Kritisk'
    if (s === 'medium') return 'Middels'
    return 'Lav'
  }

  const severityColor = (s: string) => {
    if (s === 'critical') return { bg: '#FEF2F2', color: '#DC2626' }
    if (s === 'medium') return { bg: '#FFFBEB', color: '#F59E0B' }
    return { bg: '#ECFDF5', color: '#10B981' }
  }

  const statusColor = (s: string) => {
    if (s === 'published') return { bg: '#ECFDF5', color: '#10B981' }
    return { bg: '#FEF3C7', color: '#D97706' }
  }

  const roleLabel = (r: string) => {
    if (r === 'admin') return 'Sikkerhetsansvarlig'
    if (r === 'teamleader') return 'Teamleder'
    return 'Ansatt'
  }

  const filteredInstructions = instructions.filter(i => {
    const folderMatch = selectedFolder === 'all' 
      ? true 
      : selectedFolder === 'none'
      ? !i.folder_id
      : i.folder_id === selectedFolder
    
    const statusMatch = statusFilter === 'all' ? true : i.status === statusFilter
    
    return folderMatch && statusMatch
  })

  const styles = {
    container: { minHeight: '100vh', background: '#F8FAFC' },
    header: {
      background: 'white',
      borderBottom: '1px solid #E2E8F0',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logo: {
      fontSize: 20,
      fontWeight: 800,
      background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    orgName: { fontSize: 14, color: '#64748B', marginLeft: 16 },
    logoutBtn: {
      padding: '8px 16px',
      fontSize: 14,
      background: 'none',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      cursor: 'pointer',
    },
    main: { display: 'flex' },
    sidebar: {
      width: 220,
      background: 'white',
      borderRight: '1px solid #E2E8F0',
      minHeight: 'calc(100vh - 65px)',
      padding: '16px 0',
    },
    navItem: (active: boolean) => ({
      display: 'block',
      width: '100%',
      padding: '12px 24px',
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active ? '#1E3A5F' : '#64748B',
      background: active ? '#EFF6FF' : 'transparent',
      border: 'none',
      textAlign: 'left' as const,
      cursor: 'pointer',
    }),
    content: { flex: 1, padding: 24 },
    pageTitle: { fontSize: 24, fontWeight: 700, marginBottom: 8 },
    pageSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 24 },
    card: {
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      marginBottom: 16,
    },
    cardHeader: {
      padding: '16px 20px',
      borderBottom: '1px solid #E2E8F0',
      fontWeight: 600,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardBody: { padding: 20 },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 16,
      marginBottom: 24,
    },
    statCard: {
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      padding: 20,
    },
    statValue: { fontSize: 28, fontWeight: 700 },
    statLabel: { fontSize: 13, color: '#64748B', marginTop: 4 },
    btn: {
      padding: '10px 16px',
      fontSize: 14,
      fontWeight: 600,
      color: 'white',
      background: '#1E3A5F',
      border: 'none',
      borderRadius: 8,
      cursor: 'pointer',
    },
    btnSecondary: {
      padding: '10px 16px',
      fontSize: 14,
      fontWeight: 500,
      color: '#64748B',
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      cursor: 'pointer',
    },
    btnDanger: {
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 500,
      color: '#DC2626',
      background: '#FEF2F2',
      border: '1px solid #FECACA',
      borderRadius: 6,
      cursor: 'pointer',
    },
    btnSmall: {
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 500,
      color: '#64748B',
      background: 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 6,
      cursor: 'pointer',
    },
    btnSuccess: {
      padding: '6px 12px',
      fontSize: 12,
      fontWeight: 500,
      color: '#10B981',
      background: '#ECFDF5',
      border: '1px solid #A7F3D0',
      borderRadius: 6,
      cursor: 'pointer',
    },
    table: { width: '100%', borderCollapse: 'collapse' as const },
    th: {
      textAlign: 'left' as const,
      padding: '12px 16px',
      fontSize: 12,
      fontWeight: 600,
      color: '#64748B',
      textTransform: 'uppercase' as const,
      borderBottom: '1px solid #E2E8F0',
    },
    td: {
      padding: '12px 16px',
      fontSize: 14,
      borderBottom: '1px solid #E2E8F0',
    },
    badge: (bg: string, color: string) => ({
      display: 'inline-block',
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 600,
      borderRadius: 999,
      background: bg,
      color: color,
    }),
    modal: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
    },
    modalContent: {
      background: 'white',
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 500,
      maxHeight: '90vh',
      overflowY: 'auto' as const,
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      fontSize: 14,
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      marginBottom: 16,
      boxSizing: 'border-box' as const,
    },
    textarea: {
      width: '100%',
      padding: '12px 16px',
      fontSize: 14,
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      marginBottom: 16,
      boxSizing: 'border-box' as const,
      minHeight: 100,
      resize: 'vertical' as const,
    },
    select: {
      width: '100%',
      padding: '12px 16px',
      fontSize: 14,
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      marginBottom: 16,
      boxSizing: 'border-box' as const,
    },
    label: {
      display: 'block',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 6,
      color: '#334155',
    },
    teamChip: (selected: boolean) => ({
      padding: '8px 14px',
      fontSize: 13,
      fontWeight: 500,
      borderRadius: 999,
      border: selected ? 'none' : '1px solid #E2E8F0',
      background: selected ? '#1E3A5F' : 'white',
      color: selected ? 'white' : '#64748B',
      cursor: 'pointer',
    }),
    folderChip: (selected: boolean) => ({
      padding: '8px 14px',
      fontSize: 13,
      fontWeight: 500,
      borderRadius: 8,
      border: selected ? '2px solid #1E3A5F' : '1px solid #E2E8F0',
      background: selected ? '#EFF6FF' : 'white',
      color: selected ? '#1E3A5F' : '#64748B',
      cursor: 'pointer',
      marginRight: 8,
      marginBottom: 8,
    }),
    alertCard: (severity: string, active: boolean) => ({
      background: active ? severityColor(severity).bg : '#F8FAFC',
      border: `1px solid ${active ? severityColor(severity).color : '#E2E8F0'}`,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      opacity: active ? 1 : 0.6,
    }),
    filterBar: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
      padding: 16,
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
    },
    actionBtns: { display: 'flex', gap: 8 },
    logCard: {
      background: '#F8FAFC',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    disclaimer: {
      background: '#FEF3C7',
      border: '1px solid #FDE68A',
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/tetra-logo.png" alt="Tetra" style={{ height: 32, width: 'auto' }} />
          <span style={styles.orgName}>{organization.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            style={styles.btnSmall} 
            onClick={() => setShowDisclaimer(true)}
            title="Om AI-assistenten"
          >
            ⓘ AI-info
          </button>
          <span style={{ fontSize: 14, color: '#64748B' }}>{profile.full_name}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logg ut</button>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.sidebar}>
          <button style={styles.navItem(tab === 'oversikt')} onClick={() => setTab('oversikt')}>
            📊 Oversikt
          </button>
          <button style={styles.navItem(tab === 'brukere')} onClick={() => setTab('brukere')}>
            👥 Brukere
          </button>
          <button style={styles.navItem(tab === 'team')} onClick={() => setTab('team')}>
            🏢 Team
          </button>
          <button style={styles.navItem(tab === 'instrukser')} onClick={() => setTab('instrukser')}>
            📄 Instrukser
          </button>
          <button style={styles.navItem(tab === 'avvik')} onClick={() => setTab('avvik')}>
            ⚠️ Avvik & Varsler
          </button>
          <button style={styles.navItem(tab === 'ailogg')} onClick={() => setTab('ailogg')}>
            🤖 AI-logg
          </button>
          <button style={styles.navItem(tab === 'innsikt')} onClick={() => setTab('innsikt')}>
            📈 Innsikt
          </button>
        </aside>

        <main style={styles.content}>
          {tab === 'oversikt' && (
            <>
              <h1 style={styles.pageTitle}>Oversikt</h1>
              <p style={styles.pageSubtitle}>Velkommen, {profile.full_name}</p>

              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{users.length}</div>
                  <div style={styles.statLabel}>Brukere</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{instructions.filter(i => i.status === 'published').length}</div>
                  <div style={styles.statLabel}>Publiserte instrukser</div>
                </div>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{instructions.filter(i => i.status === 'draft').length}</div>
                  <div style={styles.statLabel}>Utkast</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statValue, color: '#DC2626' }}>
                    {alerts.filter(a => a.active).length}
                  </div>
                  <div style={styles.statLabel}>Aktive avvik</div>
                </div>
              </div>

              {alerts.filter(a => a.active).length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>⚠️ Aktive avvik</h3>
                  {alerts.filter(a => a.active).slice(0, 3).map(alert => (
                    <div key={alert.id} style={styles.alertCard(alert.severity, true)}>
                      <span style={styles.badge(severityColor(alert.severity).bg, severityColor(alert.severity).color)}>
                        {severityLabel(alert.severity)}
                      </span>
                      <h4 style={{ fontSize: 15, fontWeight: 600, marginTop: 8 }}>{alert.title}</h4>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'brukere' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Brukere</h1>
                  <p style={styles.pageSubtitle}>Administrer ansatte og teamledere</p>
                </div>
                <button style={styles.btn} onClick={() => setShowInviteUser(true)}>
                  + Inviter bruker
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
          )}

          {tab === 'team' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Team</h1>
                  <p style={styles.pageSubtitle}>Opprett og administrer team</p>
                </div>
                <button style={styles.btn} onClick={() => setShowCreateTeam(true)}>
                  + Opprett team
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
          )}

          {tab === 'instrukser' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Instrukser</h1>
                  <p style={styles.pageSubtitle}>Kun publiserte instrukser er synlige for ansatte og AI</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={styles.btnSecondary} onClick={() => setShowCreateFolder(true)}>+ Ny mappe</button>
                  <button style={styles.btn} onClick={() => setShowCreateInstruction(true)}>+ Opprett instruks</button>
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
                      📁 {folder.name}
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
                          {inst.file_url && <span style={{ marginLeft: 8, color: '#64748B' }}>📎</span>}
                        </td>
                        <td style={styles.td}>{inst.folders?.name || '—'}</td>
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
          )}

          {tab === 'avvik' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Avvik & Varsler</h1>
                  <p style={styles.pageSubtitle}>Varsler vises på ansattes hjem-side</p>
                </div>
                <button style={styles.btn} onClick={() => setShowCreateAlert(true)}>+ Nytt avvik</button>
              </div>

              {alerts.length === 0 ? (
                <div style={styles.card}><div style={styles.cardBody}><p style={{ color: '#64748B' }}>Ingen avvik</p></div></div>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} style={styles.alertCard(alert.severity, alert.active)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <span style={styles.badge(severityColor(alert.severity).bg, severityColor(alert.severity).color)}>
                            {severityLabel(alert.severity)}
                          </span>
                          {!alert.active && <span style={styles.badge('#F1F5F9', '#64748B')}>Inaktiv</span>}
                        </div>
                        <h4 style={{ fontWeight: 600 }}>{alert.title}</h4>
                        {alert.description && <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{alert.description}</p>}
                        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>
                          {new Date(alert.created_at).toLocaleDateString('nb-NO')}
                        </p>
                      </div>
                      <div style={styles.actionBtns}>
                        <button style={styles.btnSmall} onClick={() => toggleAlert(alert.id, alert.active)}>
                          {alert.active ? 'Deaktiver' : 'Aktiver'}
                        </button>
                        <button style={styles.btnDanger} onClick={() => deleteAlert(alert.id)}>Slett</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'ailogg' && (
            <>
              <h1 style={styles.pageTitle}>AI-logg</h1>
              <p style={styles.pageSubtitle}>Oversikt over spørsmål til Spør Tetra</p>

              <div style={styles.disclaimer}>
                <strong>⚠️ Viktig:</strong> AI-assistenten svarer kun basert på publiserte instrukser. 
                Alle spørsmål og svar logges for kvalitetssikring og compliance.
              </div>

              {aiLogs.length === 0 ? (
                <div style={styles.card}><div style={styles.cardBody}><p style={{ color: '#64748B' }}>Ingen AI-spørsmål ennå</p></div></div>
              ) : (
                aiLogs.map(log => (
                  <div key={log.id} style={styles.logCard}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>
                        {new Date(log.created_at).toLocaleString('nb-NO')}
                      </span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Spørsmål:</span>
                      <p style={{ fontWeight: 500 }}>{log.question}</p>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: '#64748B' }}>Svar:</span>
                      <p style={{ fontSize: 14, lineHeight: 1.5 }}>{log.answer}</p>
                    </div>
                    {log.instructions && (
                      <div style={{ 
                        background: '#EFF6FF', 
                        padding: '8px 12px', 
                        borderRadius: 8,
                        fontSize: 13
                      }}>
                        📄 Kilde: {log.instructions.title}
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'innsikt' && (
            <>
              <h1 style={styles.pageTitle}>Innsikt</h1>
              <p style={styles.pageSubtitle}>Statistikk og analyse</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>AI-bruk</div>
                  <div style={styles.cardBody}>
                    <div style={styles.statValue}>{aiLogs.length}</div>
                    <div style={styles.statLabel}>Totalt antall spørsmål</div>
                  </div>
                </div>
                <div style={styles.card}>
                  <div style={styles.cardHeader}>Dokumenter</div>
                  <div style={styles.cardBody}>
                    <div style={styles.statValue}>{instructions.filter(i => i.status === 'published').length}</div>
                    <div style={styles.statLabel}>Publiserte instrukser</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div style={styles.modal} onClick={() => setShowCreateTeam(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett team</h2>
            <label style={styles.label}>Teamnavn</label>
            <input style={styles.input} value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="F.eks. Lager, Butikk" />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateTeam(false)}>Avbryt</button>
              <button style={styles.btn} onClick={createTeam} disabled={loading}>{loading ? 'Oppretter...' : 'Opprett'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div style={styles.modal} onClick={() => setShowCreateFolder(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett mappe</h2>
            <label style={styles.label}>Mappenavn</label>
            <input style={styles.input} value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="F.eks. Brann, HMS" />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateFolder(false)}>Avbryt</button>
              <button style={styles.btn} onClick={createFolder} disabled={loading}>{loading ? 'Oppretter...' : 'Opprett'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Instruction Modal */}
      {showCreateInstruction && (
        <div style={styles.modal} onClick={() => setShowCreateInstruction(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett instruks</h2>
            
            <label style={styles.label}>Tittel</label>
            <input style={styles.input} value={newInstruction.title} onChange={e => setNewInstruction({ ...newInstruction, title: e.target.value })} placeholder="F.eks. Brannrutiner" />

            <label style={styles.label}>Mappe</label>
            <select style={styles.select} value={newInstruction.folderId} onChange={e => setNewInstruction({ ...newInstruction, folderId: e.target.value })}>
              <option value="">Ingen mappe</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>

            <label style={styles.label}>Status</label>
            <select style={styles.select} value={newInstruction.status} onChange={e => setNewInstruction({ ...newInstruction, status: e.target.value })}>
              <option value="draft">Utkast (ikke synlig for ansatte)</option>
              <option value="published">Publisert (synlig for ansatte og AI)</option>
            </select>
            
            <label style={styles.label}>Innhold (brukes av AI)
              <span style={{ fontSize: 12, fontWeight: 400, color: '#64748B', marginLeft: 8 }}>
                • Valgfritt hvis du laster opp PDF. AI kan kun svare basert på tekst du skriver her.
              </span>
            </label>
            <textarea
              style={styles.textarea}
              value={newInstruction.content}
              onChange={e => setNewInstruction({ ...newInstruction, content: e.target.value })}
              placeholder="Skriv eller lim inn tekst fra PDF her for at AI skal kunne svare på spørsmål om denne instruksen..."
              rows={8}
            />
            
            <label style={styles.label}>Alvorlighet</label>
            <select style={styles.select} value={newInstruction.severity} onChange={e => setNewInstruction({ ...newInstruction, severity: e.target.value })}>
              <option value="critical">Kritisk</option>
              <option value="medium">Middels</option>
              <option value="low">Lav</option>
            </select>

            <label style={styles.label}>Vedlegg (PDF)</label>
            <input type="file" accept=".pdf" onChange={e => setSelectedFile(e.target.files?.[0] || null)} style={{ marginBottom: 16 }} />
            {selectedFile && <p style={{ fontSize: 13, color: '#10B981', marginBottom: 16 }}>✓ {selectedFile.name}</p>}

            <label style={styles.label}>Team</label>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={newInstruction.allTeams} onChange={e => setNewInstruction({ ...newInstruction, allTeams: e.target.checked, teamIds: [] })} />
                <span>Alle team</span>
              </label>
              {!newInstruction.allTeams && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {teams.map(team => (
                    <button key={team.id} type="button" onClick={() => {
                      const ids = newInstruction.teamIds.includes(team.id) ? newInstruction.teamIds.filter(id => id !== team.id) : [...newInstruction.teamIds, team.id]
                      setNewInstruction({ ...newInstruction, teamIds: ids })
                    }} style={styles.teamChip(newInstruction.teamIds.includes(team.id))}>{team.name}</button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateInstruction(false)}>Avbryt</button>
              <button style={styles.btn} onClick={createInstruction} disabled={loading}>{loading ? 'Oppretter...' : 'Opprett'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Instruction Modal */}
      {showEditInstruction && editingInstruction && (
        <div style={styles.modal} onClick={() => setShowEditInstruction(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Rediger instruks</h2>
            
            <label style={styles.label}>Tittel</label>
            <input style={styles.input} value={editInstructionTitle} onChange={e => setEditInstructionTitle(e.target.value)} />

            <label style={styles.label}>Mappe</label>
            <select style={styles.select} value={editInstructionFolder} onChange={e => setEditInstructionFolder(e.target.value)}>
              <option value="">Ingen mappe</option>
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>

            <label style={styles.label}>Status</label>
            <select style={styles.select} value={editInstructionStatus} onChange={e => setEditInstructionStatus(e.target.value)}>
              <option value="draft">Utkast</option>
              <option value="published">Publisert</option>
            </select>
            
            <label style={styles.label}>Innhold</label>
            <textarea style={styles.textarea} value={editInstructionContent} onChange={e => setEditInstructionContent(e.target.value)} />
            
            <label style={styles.label}>Alvorlighet</label>
            <select style={styles.select} value={editInstructionSeverity} onChange={e => setEditInstructionSeverity(e.target.value)}>
              <option value="critical">Kritisk</option>
              <option value="medium">Middels</option>
              <option value="low">Lav</option>
            </select>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowEditInstruction(false)}>Avbryt</button>
              <button style={styles.btn} onClick={saveEditInstruction} disabled={loading}>{loading ? 'Lagrer...' : 'Lagre'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteUser && (
        <div style={styles.modal} onClick={() => setShowInviteUser(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Inviter bruker</h2>
            
            <label style={styles.label}>E-postadresse</label>
            <input style={styles.input} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="bruker@bedrift.no" />
            
            <label style={styles.label}>Rolle</label>
            <select style={styles.select} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
              <option value="employee">Ansatt</option>
              <option value="teamleader">Teamleder</option>
              <option value="admin">Sikkerhetsansvarlig</option>
            </select>

            <label style={styles.label}>Team</label>
            <select style={styles.select} value={inviteTeam} onChange={e => setInviteTeam(e.target.value)}>
              <option value="">Velg team...</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowInviteUser(false)}>Avbryt</button>
              <button style={styles.btn} onClick={inviteUser} disabled={loading}>{loading ? 'Sender...' : 'Opprett invitasjon'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div style={styles.modal} onClick={() => setShowEditUser(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Rediger bruker</h2>
            <p style={{ color: '#64748B', marginBottom: 16 }}>{editingUser.full_name}</p>
            
            <label style={styles.label}>Rolle</label>
            <select style={styles.select} value={editUserRole} onChange={e => setEditUserRole(e.target.value)}>
              <option value="employee">Ansatt</option>
              <option value="teamleader">Teamleder</option>
              <option value="admin">Sikkerhetsansvarlig</option>
            </select>

            <label style={styles.label}>Team</label>
            <select style={styles.select} value={editUserTeam} onChange={e => setEditUserTeam(e.target.value)}>
              <option value="">Ingen team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowEditUser(false)}>Avbryt</button>
              <button style={styles.btn} onClick={saveEditUser} disabled={loading}>{loading ? 'Lagrer...' : 'Lagre'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <div style={styles.modal} onClick={() => setShowCreateAlert(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Opprett avvik</h2>
            
            <label style={styles.label}>Tittel</label>
            <input style={styles.input} value={newAlert.title} onChange={e => setNewAlert({ ...newAlert, title: e.target.value })} placeholder="F.eks. Stengt nødutgang" />
            
            <label style={styles.label}>Beskrivelse</label>
            <textarea style={styles.textarea} value={newAlert.description} onChange={e => setNewAlert({ ...newAlert, description: e.target.value })} />
            
            <label style={styles.label}>Alvorlighet</label>
            <select style={styles.select} value={newAlert.severity} onChange={e => setNewAlert({ ...newAlert, severity: e.target.value })}>
              <option value="critical">Kritisk</option>
              <option value="medium">Middels</option>
              <option value="low">Lav</option>
            </select>

            <label style={styles.label}>Synlig for</label>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={newAlert.allTeams} onChange={e => setNewAlert({ ...newAlert, allTeams: e.target.checked, teamIds: [] })} />
                <span>Alle team</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button style={styles.btnSecondary} onClick={() => setShowCreateAlert(false)}>Avbryt</button>
              <button style={styles.btn} onClick={createAlert} disabled={loading}>{loading ? 'Oppretter...' : 'Opprett'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div style={styles.modal} onClick={() => setShowDisclaimer(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>ℹ️ Om AI-assistenten</h2>
            
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

            <button style={styles.btn} onClick={() => setShowDisclaimer(false)}>Lukk</button>
          </div>
        </div>
      )}
    </div>
  )
}