'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { logAuditEventClient } from '@/lib/audit-log'
import { extractKeywords } from '@/lib/keyword-extraction'
import { cleanupInviteData } from '@/lib/invite-cleanup'
import AuthWatcher from '@/components/AuthWatcher'
import EmptyState from '@/components/EmptyState'
import {
  Home,
  Users,
  UsersRound,
  FileText,
  AlertTriangle,
  Bot,
  BarChart3,
  ClipboardList,
  CheckSquare,
  Menu,
  X,
  Info,
  LogOut,
  Plus,
  FolderOpen,
  Download,
  ChevronDown,
  ChevronRight,
  Paperclip,
} from 'lucide-react'
import type {
  Profile,
  Organization,
  Team,
  Instruction,
  Folder,
  Alert,
  AiLog
} from '@/lib/types'
import {
  severityLabel,
  severityColor,
  roleLabel,
  statusColor
} from '@/lib/ui-helpers'
import { createAdminStyles } from './styles'
import {
  formatActionType as formatActionTypeFn,
  exportAuditLogsCSV as exportAuditCSV,
  exportReadReportCSV as exportReadCSV,
  type AuditLogRow,
  type ReadReportItem
} from './utils'
import {
  OverviewTab,
  UsersTab,
  TeamsTab,
  InstructionsTab,
  AlertsTab,
  AiLogTab,
  InsightsTab,
  AuditLogTab,
  ReadConfirmationsTab
} from './tabs'

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
  const [tab, setTab] = useState<'oversikt' | 'brukere' | 'team' | 'instrukser' | 'avvik' | 'ailogg' | 'innsikt' | 'auditlog' | 'lesebekreftelser'>('oversikt')
  const [teams, setTeams] = useState(initialTeams)
  const [users, setUsers] = useState(initialUsers)
  const [instructions, setInstructions] = useState(initialInstructions)
  const [folders, setFolders] = useState(initialFolders)
  const [alerts, setAlerts] = useState(initialAlerts)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    // Cleanup invite data on mount (hvis bruker kom fra invite flow)
    cleanupInviteData()
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Audit log states
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const [auditFilter, setAuditFilter] = useState({
    actionType: 'all',
    startDate: '',
    endDate: ''
  })

  // Read confirmations states
  const [readReport, setReadReport] = useState<ReadReportItem[]>([])
  const [readReportLoading, setReadReportLoading] = useState(false)
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set())

  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Helper functions for audit logs and read confirmations
  const loadAuditLogs = useCallback(async () => {
    setAuditLogsLoading(true)
    try {
      const params = new URLSearchParams()
      if (auditFilter.actionType !== 'all') params.append('action_type', auditFilter.actionType)
      if (auditFilter.startDate) params.append('start_date', auditFilter.startDate)
      if (auditFilter.endDate) params.append('end_date', auditFilter.endDate)

      const response = await fetch(`/api/audit-logs?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.logs) {
        setAuditLogs(data.logs)
      }
    } catch (error) {
      console.error('Load audit logs error:', error)
      toast.error('Kunne ikke laste aktivitetslogg. Prøv igjen.')
    } finally {
      setAuditLogsLoading(false)
    }
  }, [auditFilter.actionType, auditFilter.startDate, auditFilter.endDate])

  useEffect(() => {
    if (tab === 'auditlog') {
      loadAuditLogs()
    }
  }, [tab, loadAuditLogs])

  const loadReadReport = async () => {
    setReadReportLoading(true)
    try {
      const response = await fetch('/api/read-confirmations')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      if (data.report) {
        setReadReport(data.report)
      }
    } catch (error) {
      console.error('Load read report error:', error)
      toast.error('Kunne ikke laste lesebekreftelser. Prøv igjen.')
    } finally {
      setReadReportLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'lesebekreftelser') {
      loadReadReport()
    }
  }, [tab])


  const toggleInstructionExpansion = (instructionId: string) => {
    const newExpanded = new Set(expandedInstructions)
    if (newExpanded.has(instructionId)) {
      newExpanded.delete(instructionId)
    } else {
      newExpanded.add(instructionId)
    }
    setExpandedInstructions(newExpanded)
  }

  const createTeam = async () => {
    if (!newTeamName.trim()) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({ name: newTeamName, org_id: profile.org_id })
        .select()
        .single()

      if (error) throw error

      setTeams([...teams, data])
      setNewTeamName('')
      setShowCreateTeam(false)
      toast.success('Team opprettet')
    } catch (error) {
      console.error('Create team error:', error)
      toast.error('Kunne ikke opprette team. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Er du sikker på at du vil slette dette teamet?')) return

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)

      if (error) throw error

      setTeams(teams.filter(t => t.id !== teamId))
      toast.success('Team slettet')
    } catch (error) {
      console.error('Delete team error:', error)
      toast.error('Kunne ikke slette team. Prøv igjen.')
    }
  }

  const createFolder = async () => {
    if (!newFolderName.trim()) return
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({ name: newFolderName, org_id: profile.org_id })
        .select()
        .single()

      if (error) throw error

      setFolders([...folders, data])
      setNewFolderName('')
      setShowCreateFolder(false)
      toast.success('Mappe opprettet')
    } catch (error) {
      console.error('Create folder error:', error)
      toast.error('Kunne ikke opprette mappe. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Slette mappen? Instrukser i mappen beholdes.')) return

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId)

      if (error) throw error

      setFolders(folders.filter(f => f.id !== folderId))
      setInstructions(instructions.map(i =>
        i.folder_id === folderId ? { ...i, folder_id: null, folders: null } : i
      ))
      toast.success('Mappe slettet')
    } catch (error) {
      console.error('Delete folder error:', error)
      toast.error('Kunne ikke slette mappe. Prøv igjen.')
    }
  }

  const createInstruction = async () => {
    if (!newInstruction.title.trim()) return
    if (!newInstruction.allTeams && newInstruction.teamIds.length === 0) {
      toast.error('Velg minst ett team eller bruk Alle team')
      return
    }
    setLoading(true)

    try {
      // "Alle team" = no mappings (empty array), not all team IDs
      const teamIdsToLink = newInstruction.allTeams
        ? []
        : newInstruction.teamIds

      if (selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('title', newInstruction.title)
        formData.append('content', newInstruction.content || '')
        formData.append('severity', newInstruction.severity)
        formData.append('status', newInstruction.status)
        formData.append('orgId', profile.org_id)
        formData.append('userId', profile.id)
        formData.append('teamIds', JSON.stringify(teamIdsToLink))
        formData.append('allTeams', newInstruction.allTeams.toString())
        if (newInstruction.folderId) {
          formData.append('folderId', newInstruction.folderId)
        }
        // Extract keywords for file upload
        const textForKeywords = `${newInstruction.title} ${newInstruction.content}`.trim()
        const keywords = extractKeywords(textForKeywords, 10)
        formData.append('keywords', JSON.stringify(keywords))

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (result.error) {
          toast.error(result.error)
          setLoading(false)
          return
        }

        if (result.instruction) {
          const folder = folders.find(f => f.id === newInstruction.folderId)
          setInstructions([{ 
            ...result.instruction, 
            folders: folder ? { name: folder.name } : null 
          }, ...instructions])

          await logAuditEventClient(supabase, {
            orgId: profile.org_id,
            userId: profile.id,
            actionType: 'create_instruction',
            entityType: 'instruction',
            entityId: result.instruction.id,
            details: {
              instruction_title: result.instruction.title,
              severity: result.instruction.severity,
              status: result.instruction.status
            }
          })

          if (result.instruction.status === 'published') {
            await logAuditEventClient(supabase, {
              orgId: profile.org_id,
              userId: profile.id,
              actionType: 'publish_instruction',
              entityType: 'instruction',
              entityId: result.instruction.id,
              details: {
                instruction_title: result.instruction.title,
                severity: result.instruction.severity
              }
            })
          }
        }
      } else {
        // Extract keywords from title and content
        const textForKeywords = `${newInstruction.title} ${newInstruction.content}`.trim()
        const keywords = extractKeywords(textForKeywords, 10)

        const { data, error } = await supabase
          .from('instructions')
          .insert({
            title: newInstruction.title,
            content: newInstruction.content,
            severity: newInstruction.severity,
            status: newInstruction.status,
            org_id: profile.org_id,
            created_by: profile.id,
            folder_id: newInstruction.folderId || null,
            keywords: keywords
          })
          .select('*, folders(*)')
          .single()

        if (error) {
          toast.error('Kunne ikke opprette instruks')
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

          await logAuditEventClient(supabase, {
            orgId: profile.org_id,
            userId: profile.id,
            actionType: 'create_instruction',
            entityType: 'instruction',
            entityId: data.id,
            details: {
              instruction_title: data.title,
              severity: data.severity,
              status: data.status
            }
          })

          if (data.status === 'published') {
            await logAuditEventClient(supabase, {
              orgId: profile.org_id,
              userId: profile.id,
              actionType: 'publish_instruction',
              entityType: 'instruction',
              entityId: data.id,
              details: {
                instruction_title: data.title,
                severity: data.severity
              }
            })
          }
        }
      }

      setNewInstruction({ title: '', content: '', severity: 'medium', status: 'draft', folderId: '', teamIds: [], allTeams: false })
      setSelectedFile(null)
      setShowCreateInstruction(false)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Noe gikk galt')
    }

    setLoading(false)
  }

  const deleteInstruction = async (instructionId: string) => {
    if (!confirm('Slette instruksen? Dette fjerner også tilhørende data.')) return

    try {
      const instructionToDelete = instructions.find(i => i.id === instructionId)

      const { error } = await supabase
        .from('instructions')
        .delete()
        .eq('id', instructionId)

      if (error) throw error

      setInstructions(instructions.filter(i => i.id !== instructionId))
      toast.success('Instruks slettet')

      // Log audit event
      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'delete_instruction',
        entityType: 'instruction',
        entityId: instructionId,
        details: {
          instruction_title: instructionToDelete?.title || 'Ukjent',
          severity: instructionToDelete?.severity || 'unknown'
        }
      })
    } catch (error) {
      console.error('Delete instruction error:', error)
      toast.error('Kunne ikke slette instruks. Prøv igjen.')
    }
  }

  const toggleInstructionStatus = async (instruction: Instruction) => {
    const newStatus = instruction.status === 'published' ? 'draft' : 'published'

    try {
      const { error } = await supabase
        .from('instructions')
        .update({ status: newStatus })
        .eq('id', instruction.id)

      if (error) throw error

      setInstructions(instructions.map(i =>
        i.id === instruction.id ? { ...i, status: newStatus } : i
      ))
      toast.success(newStatus === 'published' ? 'Instruks publisert' : 'Instruks avpublisert')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: newStatus === 'published' ? 'publish_instruction' : 'unpublish_instruction',
        entityType: 'instruction',
        entityId: instruction.id,
        details: {
          instruction_title: instruction.title,
          severity: instruction.severity
        }
      })
    } catch (error) {
      console.error('Toggle instruction status error:', error)
      toast.error('Kunne ikke endre status. Prøv igjen.')
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

    try {
      const wasPublished = editingInstruction.status === 'published'
      const willBePublished = editInstructionStatus === 'published'

      // Extract keywords from updated content
      const textForKeywords = `${editInstructionTitle} ${editInstructionContent}`.trim()
      const keywords = extractKeywords(textForKeywords, 10)

      const { data, error } = await supabase
        .from('instructions')
        .update({
          title: editInstructionTitle,
          content: editInstructionContent,
          severity: editInstructionSeverity,
          status: editInstructionStatus,
          folder_id: editInstructionFolder || null,
          keywords: keywords
        })
        .eq('id', editingInstruction.id)
        .select('*, folders(*)')
        .single()

      if (error) throw error

      setInstructions(instructions.map(i =>
        i.id === editingInstruction.id ? data : i
      ))
      setShowEditInstruction(false)
      setEditingInstruction(null)
      toast.success('Instruks oppdatert')

      // Log audit event if status changed to/from published
      if (!wasPublished && willBePublished) {
        await logAuditEventClient(supabase, {
          orgId: profile.org_id,
          userId: profile.id,
          actionType: 'publish_instruction',
          entityType: 'instruction',
          entityId: data.id,
          details: {
            instruction_title: data.title,
            severity: data.severity
          }
        })
      } else if (wasPublished && !willBePublished) {
        await logAuditEventClient(supabase, {
          orgId: profile.org_id,
          userId: profile.id,
          actionType: 'unpublish_instruction',
          entityType: 'instruction',
          entityId: data.id,
          details: {
            instruction_title: data.title,
            severity: data.severity
          }
        })
      }
    } catch (error) {
      console.error('Save edit instruction error:', error)
      toast.error('Kunne ikke lagre endringer. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (userId === profile.id) {
      toast.error('Du kan ikke slette deg selv')
      return
    }
    if (!confirm('Fjerne denne brukeren?')) return

    try {
      const userToDelete = users.find(u => u.id === userId)

      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      setUsers(users.filter(u => u.id !== userId))
      toast.success('Bruker fjernet')

      // Log audit event
      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'delete_user',
        entityType: 'user',
        entityId: userId,
        details: {
          user_name: userToDelete?.full_name || 'Ukjent',
          user_role: userToDelete?.role || 'unknown'
        }
      })
    } catch (error) {
      console.error('Delete user error:', error)
      toast.error('Kunne ikke fjerne bruker. Prøv igjen.')
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

    try {
      const roleChanged = editingUser.role !== editUserRole

      const { error } = await supabase
        .from('profiles')
        .update({
          role: editUserRole,
          team_id: editUserTeam || null
        })
        .eq('id', editingUser.id)

      if (error) throw error

      setUsers(users.map(u =>
        u.id === editingUser.id
          ? { ...u, role: editUserRole, team_id: editUserTeam || null }
          : u
      ))
      setShowEditUser(false)
      toast.success('Bruker oppdatert')

      // Log audit event if role changed
      if (roleChanged) {
        await logAuditEventClient(supabase, {
          orgId: profile.org_id,
          userId: profile.id,
          actionType: 'change_role',
          entityType: 'user',
          entityId: editingUser.id,
          details: {
            user_name: editingUser.full_name,
            previous_role: editingUser.role,
            new_role: editUserRole
          }
        })
      }

      setEditingUser(null)
    } catch (error) {
      console.error('Save edit user error:', error)
      toast.error('Kunne ikke oppdatere bruker. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return
    setLoading(true)

    // Capture state before resetting
    const emailToLog = inviteEmail.trim()
    const roleToLog = inviteRole
    const teamToLog = inviteTeam || null

    try {
      const { data, error } = await supabase
        .from('invites')
        .insert({
          role: roleToLog,
          team_id: teamToLog,
          org_id: profile.org_id
        })
        .select()
        .single()

      if (error) throw error

      const inviteUrl = `${window.location.origin}/invite/${data.token}`
      await navigator.clipboard.writeText(inviteUrl)

      // Log audit event BEFORE resetting state
      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'invite_user',
        entityType: 'invite',
        entityId: data.id,
        details: {
          invited_email: emailToLog,
          invited_role: roleToLog,
          invited_team_id: teamToLog
        }
      })

      toast.success('Invitasjonslenke kopiert!')
      setInviteEmail('')
      setInviteRole('employee')
      setInviteTeam('')
      setShowInviteUser(false)
    } catch (error) {
      console.error('Invite user error:', error)
      toast.error('Kunne ikke opprette invitasjon. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const createAlert = async () => {
    if (!newAlert.title.trim()) return
    if (!newAlert.allTeams && newAlert.teamIds.length === 0) {
      toast.error('Velg minst ett team eller bruk Alle team')
      return
    }
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('alerts')
        .insert({
          title: newAlert.title,
          description: newAlert.description,
          severity: newAlert.severity,
          org_id: profile.org_id,
          active: true
        })
        .select()
        .single()

      if (error) throw error

      // "Alle team" = no mappings (empty array), not all team IDs
      const teamIdsToLink = newAlert.allTeams
        ? []
        : newAlert.teamIds

      if (teamIdsToLink.length > 0) {
        const { error: teamError } = await supabase.from('alert_teams').insert(
          teamIdsToLink.map(teamId => ({
            alert_id: data.id,
            team_id: teamId
          }))
        )
        if (teamError) console.error('Alert teams link error:', teamError)
      }

      setAlerts([data, ...alerts])
      setNewAlert({ title: '', description: '', severity: 'medium', teamIds: [], allTeams: true })
      setShowCreateAlert(false)
      toast.success('Avvik opprettet')
    } catch (error) {
      console.error('Create alert error:', error)
      toast.error('Kunne ikke opprette avvik. Prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  const toggleAlert = async (alertId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ active: !active })
        .eq('id', alertId)

      if (error) throw error

      setAlerts(alerts.map(a => a.id === alertId ? { ...a, active: !active } : a))
      toast.success(active ? 'Avvik deaktivert' : 'Avvik aktivert')
    } catch (error) {
      console.error('Toggle alert error:', error)
      toast.error('Kunne ikke endre avviksstatus. Prøv igjen.')
    }
  }

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Slette dette avviket?')) return

    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId)

      if (error) throw error

      setAlerts(alerts.filter(a => a.id !== alertId))
      toast.success('Avvik slettet')
    } catch (error) {
      console.error('Delete alert error:', error)
      toast.error('Kunne ikke slette avvik. Prøv igjen.')
    }
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

  const styles = createAdminStyles(isMobile)

  return (
    <>
      <AuthWatcher />
      <div style={styles.container}>
        <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isMobile && (
            <button
              style={styles.mobileMenuBtn}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label={showMobileMenu ? 'Lukk meny' : 'Åpne meny'}
            >
              {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
          <Image
            src="/tetra-logo.png"
            alt="Tetra"
            width={120}
            height={32}
            style={{ height: 32, width: 'auto' }}
          />
          {!isMobile && <span style={styles.orgName}>{organization.name}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isMobile && (
            <button
              style={styles.btnSmall}
              onClick={() => setShowDisclaimer(true)}
              title="Om AI-assistenten"
            >
              <Info size={14} style={{ marginRight: 4 }} />
              AI-info
            </button>
          )}
          {!isMobile && <span style={{ fontSize: 14, color: '#64748B' }}>{profile.full_name}</span>}
          <button style={styles.logoutBtn} onClick={handleLogout}>
            {isMobile ? <LogOut size={18} /> : <><LogOut size={16} style={{ marginRight: 6 }} />Logg ut</>}
          </button>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.sidebar(showMobileMenu)}>
          <button style={styles.navItem(tab === 'oversikt')} onClick={() => { setTab('oversikt'); setShowMobileMenu(false); }}>
            <Home size={18} style={styles.navIcon(tab === 'oversikt')} />
            Oversikt
          </button>
          <button style={styles.navItem(tab === 'brukere')} onClick={() => { setTab('brukere'); setShowMobileMenu(false); }}>
            <Users size={18} style={styles.navIcon(tab === 'brukere')} />
            Brukere
          </button>
          <button style={styles.navItem(tab === 'team')} onClick={() => { setTab('team'); setShowMobileMenu(false); }}>
            <UsersRound size={18} style={styles.navIcon(tab === 'team')} />
            Team
          </button>
          <button style={styles.navItem(tab === 'instrukser')} onClick={() => { setTab('instrukser'); setShowMobileMenu(false); }}>
            <FileText size={18} style={styles.navIcon(tab === 'instrukser')} />
            Instrukser
          </button>
          <button style={styles.navItem(tab === 'avvik')} onClick={() => { setTab('avvik'); setShowMobileMenu(false); }}>
            <AlertTriangle size={18} style={styles.navIcon(tab === 'avvik')} />
            Avvik & Varsler
          </button>
          <button style={styles.navItem(tab === 'ailogg')} onClick={() => { setTab('ailogg'); setShowMobileMenu(false); }}>
            <Bot size={18} style={styles.navIcon(tab === 'ailogg')} />
            AI-logg
          </button>
          <button style={styles.navItem(tab === 'innsikt')} onClick={() => { setTab('innsikt'); setShowMobileMenu(false); }}>
            <BarChart3 size={18} style={styles.navIcon(tab === 'innsikt')} />
            Innsikt
          </button>
          <button style={styles.navItem(tab === 'auditlog')} onClick={() => { setTab('auditlog'); setShowMobileMenu(false); }}>
            <ClipboardList size={18} style={styles.navIcon(tab === 'auditlog')} />
            Aktivitetslogg
          </button>
          <button style={styles.navItem(tab === 'lesebekreftelser')} onClick={() => { setTab('lesebekreftelser'); setShowMobileMenu(false); }}>
            <CheckSquare size={18} style={styles.navIcon(tab === 'lesebekreftelser')} />
            Lesebekreftelser
          </button>
        </aside>

        <main style={styles.content}>
          {tab === 'oversikt' && (
            <OverviewTab
              profile={profile}
              users={users}
              instructions={instructions}
              alerts={alerts}
              styles={styles}
              setTab={setTab}
            />
          )}

          {tab === 'brukere' && (
            <UsersTab
              profile={profile}
              users={users}
              teams={teams}
              styles={styles}
              openEditUser={openEditUser}
              deleteUser={deleteUser}
              setShowInviteUser={setShowInviteUser}
            />
          )}

          {tab === 'team' && (
            <TeamsTab
              teams={teams}
              users={users}
              styles={styles}
              deleteTeam={deleteTeam}
              setShowCreateTeam={setShowCreateTeam}
            />
          )}

          {tab === 'instrukser' && (
            <InstructionsTab
              instructions={instructions}
              folders={folders}
              filteredInstructions={filteredInstructions}
              selectedFolder={selectedFolder}
              statusFilter={statusFilter}
              styles={styles}
              setSelectedFolder={setSelectedFolder}
              setStatusFilter={setStatusFilter}
              toggleInstructionStatus={toggleInstructionStatus}
              openEditInstruction={openEditInstruction}
              deleteInstruction={deleteInstruction}
              deleteFolder={deleteFolder}
              setShowCreateInstruction={setShowCreateInstruction}
              setShowCreateFolder={setShowCreateFolder}
            />
          )}

          {tab === 'avvik' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Avvik & Varsler</h1>
                  <p style={styles.pageSubtitle}>Varsler vises på ansattes hjem-side</p>
                </div>
                <button style={styles.btn} onClick={() => setShowCreateAlert(true)}>
                  <Plus size={16} />
                  Nytt avvik
                </button>
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

          {tab === 'auditlog' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Aktivitetslogg</h1>
                  <p style={styles.pageSubtitle}>Sporbar logg over kritiske admin-handlinger</p>
                </div>
                <button style={styles.btn} onClick={() => exportAuditCSV(auditLogs, formatActionTypeFn)}>
                  <Download size={16} />
                  Eksporter CSV
                </button>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>Filtrer aktivitetslogg</div>
                <div style={styles.cardBody}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={styles.label}>Handlingstype</label>
                      <select
                        style={styles.select}
                        value={auditFilter.actionType}
                        onChange={(e) => setAuditFilter({ ...auditFilter, actionType: e.target.value })}
                      >
                        <option value="all">Alle handlinger</option>
                        <option value="create_instruction">Opprett instruks</option>
                        <option value="publish_instruction">Publiser instruks</option>
                        <option value="unpublish_instruction">Avpubliser instruks</option>
                        <option value="delete_instruction">Slett instruks</option>
                        <option value="create_user">Opprett bruker</option>
                        <option value="edit_user">Rediger bruker</option>
                        <option value="delete_user">Slett bruker</option>
                        <option value="invite_user">Inviter bruker</option>
                        <option value="change_role">Endre rolle</option>
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Fra dato</label>
                      <input
                        type="date"
                        style={styles.input}
                        value={auditFilter.startDate}
                        onChange={(e) => setAuditFilter({ ...auditFilter, startDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Til dato</label>
                      <input
                        type="date"
                        style={styles.input}
                        value={auditFilter.endDate}
                        onChange={(e) => setAuditFilter({ ...auditFilter, endDate: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button style={styles.btn} onClick={loadAuditLogs} disabled={auditLogsLoading}>
                        {auditLogsLoading ? 'Laster...' : 'Filtrer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardHeader}>Aktivitetslogg ({auditLogs.length} hendelser)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Tidspunkt</th>
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Bruker</th>
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Handling</th>
                        <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Detaljer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogsLoading ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
                            Laster aktivitetslogg...
                          </td>
                        </tr>
                      ) : auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ padding: 0 }}>
                            <EmptyState
                              icon="📊"
                              title="Ingen aktivitet funnet"
                              description="Prøv å endre filtrene eller kom tilbake senere."
                              actionLabel="Nullstill filter"
                              onAction={() => {
                                setAuditFilter({ actionType: 'all', startDate: '', endDate: '' })
                                loadAuditLogs()
                              }}
                            />
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: 12, fontSize: 13 }}>
                              {new Date(log.created_at).toLocaleString('no-NO', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td style={{ padding: 12, fontSize: 13 }}>
                              <div style={{ fontWeight: 500 }}>{log.profiles?.full_name || 'Ukjent'}</div>
                              <div style={{ fontSize: 12, color: '#64748B' }}>{log.profiles?.email || ''}</div>
                            </td>
                            <td style={{ padding: 12, fontSize: 13 }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 500,
                                backgroundColor: log.action_type.includes('delete') ? '#FEE2E2' : log.action_type.includes('publish') ? '#D1FAE5' : '#DBEAFE',
                                color: log.action_type.includes('delete') ? '#DC2626' : log.action_type.includes('publish') ? '#10B981' : '#3B82F6'
                              }}>
                                {formatActionTypeFn(log.action_type)}
                              </span>
                            </td>
                            <td style={{ padding: 12, fontSize: 13 }}>
                              {log.details && typeof log.details === 'object' && (
                                <div style={{ fontSize: 12, color: '#64748B' }}>
                                  {Object.entries(log.details).map(([key, value]) => (
                                    <div key={key}>
                                      <strong>{key}:</strong> {String(value)}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {tab === 'lesebekreftelser' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h1 style={styles.pageTitle}>Lesebekreftelser</h1>
                  <p style={styles.pageSubtitle}>Oversikt over hvem som har lest og bekreftet instrukser</p>
                </div>
                <button style={styles.btn} onClick={() => exportReadCSV(readReport)}>
                  <Download size={16} />
                  Eksporter CSV
                </button>
              </div>

              {readReportLoading ? (
                <div style={{ ...styles.card, padding: 48, textAlign: 'center', color: '#64748B' }}>
                  Laster lesebekreftelser...
                </div>
              ) : readReport.length === 0 ? (
                <div style={styles.card}>
                  <EmptyState
                    icon="📋"
                    title="Ingen lesebekreftelser ennå"
                    description="Når ansatte begynner å lese og bekrefte instrukser, vil de vises her."
                  />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {readReport.map((instruction) => {
                    const isExpanded = expandedInstructions.has(instruction.instruction_id)
                    return (
                      <div key={instruction.instruction_id} style={styles.card}>
                        <div
                          style={{
                            ...styles.cardHeader,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onClick={() => toggleInstructionExpansion(instruction.instruction_id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            <span style={{ fontWeight: 600 }}>{instruction.instruction_title}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                            <div>
                              <span style={{ color: '#64748B' }}>Lest: </span>
                              <span style={{ fontWeight: 600, color: '#3B82F6' }}>
                                {instruction.read_count}/{instruction.total_users} ({instruction.read_percentage}%)
                              </span>
                            </div>
                            <div>
                              <span style={{ color: '#64748B' }}>Bekreftet: </span>
                              <span style={{ fontWeight: 600, color: '#10B981' }}>
                                {instruction.confirmed_count}/{instruction.total_users} ({instruction.confirmed_percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={styles.cardBody}>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Ansatt</th>
                                    <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>E-post</th>
                                    <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Lest</th>
                                    <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Bekreftet</th>
                                    <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#64748B' }}>Dato</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {instruction.user_statuses.map((user) => (
                                    <tr key={user.user_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                      <td style={{ padding: 12, fontSize: 13, fontWeight: 500 }}>{user.user_name}</td>
                                      <td style={{ padding: 12, fontSize: 13, color: '#64748B' }}>{user.user_email}</td>
                                      <td style={{ padding: 12, textAlign: 'center' }}>
                                        {user.read ? (
                                          <span style={{ color: '#3B82F6', fontSize: 16 }}>✓</span>
                                        ) : (
                                          <span style={{ color: '#CBD5E1', fontSize: 16 }}>○</span>
                                        )}
                                      </td>
                                      <td style={{ padding: 12, textAlign: 'center' }}>
                                        {user.confirmed ? (
                                          <span style={{ color: '#10B981', fontSize: 16 }}>✓</span>
                                        ) : (
                                          <span style={{ color: '#CBD5E1', fontSize: 16 }}>○</span>
                                        )}
                                      </td>
                                      <td style={{ padding: 12, fontSize: 13, color: '#64748B' }}>
                                        {user.confirmed_at ? (
                                          new Date(user.confirmed_at).toLocaleString('no-NO', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        ) : user.read_at ? (
                                          new Date(user.read_at).toLocaleString('no-NO', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })
                                        ) : (
                                          '-'
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
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
              <button style={{...styles.btn, ...(loading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={createTeam} disabled={loading}>{loading ? 'Oppretter...' : 'Opprett'}</button>
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
              <button style={{...styles.btn, ...(loading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={createFolder} disabled={loading}>{loading ? 'Oppretter...' : 'Opprett'}</button>
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
              <button style={{...styles.btn, ...(loading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={createInstruction} disabled={loading}>{loading ? 'Oppretter...' : 'Opprett'}</button>
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
              <button style={{...styles.btn, ...(loading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={saveEditInstruction} disabled={loading}>{loading ? 'Lagrer...' : 'Lagre'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite User Modal */}
      {showInviteUser && (
        <div style={styles.modal} onClick={() => setShowInviteUser(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Lag invitasjonslenke</h2>

            <label style={styles.label}>E-post (kun for referanse)</label>
            <input style={styles.input} type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="bruker@bedrift.no" />
            <p style={{ fontSize: 13, color: '#64748B', marginTop: -12, marginBottom: 16 }}>
              E-posten lagres ikke i databasen. Den brukes kun for logging og referanse.
            </p>
            
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
              <button style={{...styles.btn, ...(loading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={inviteUser} disabled={loading}>{loading ? 'Sender...' : 'Opprett invitasjon'}</button>
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
              <button style={{...styles.btn, ...(loading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={saveEditUser} disabled={loading}>{loading ? 'Lagrer...' : 'Lagre'}</button>
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
              {!newAlert.allTeams && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  {teams.map(team => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => {
                        const ids = newAlert.teamIds.includes(team.id)
                          ? newAlert.teamIds.filter(id => id !== team.id)
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
              <button style={styles.btnSecondary} onClick={() => setShowCreateAlert(false)}>Avbryt</button>
              <button style={{...styles.btn, ...(loading ? {background: '#9CA3AF', cursor: 'not-allowed', opacity: 0.6} : {})}} onClick={createAlert} disabled={loading}>{loading ? 'Oppretter...' : 'Opprett'}</button>
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
    </>
  )
}
