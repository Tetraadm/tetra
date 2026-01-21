import { useCallback, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { logAuditEventClient } from '@/lib/audit-log'
import { extractKeywords } from '@/lib/keyword-extraction'
import type { createClient } from '@/lib/supabase/client'
import type { Folder, Instruction, Profile } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

const PAGE_SIZE = 50

export type NewInstructionState = {
  title: string
  content: string
  severity: string
  status: string
  folderId: string
  teamIds: string[]
  allTeams: boolean
}

type UseAdminInstructionsOptions = {
  profile: Profile
  initialInstructions: Instruction[]
  initialFolders: Folder[]
  supabase: SupabaseClient
  onCloseCreateInstruction?: () => void
  onCloseEditInstruction?: () => void
  onOpenEditInstruction?: () => void
  onCloseCreateFolder?: () => void
}

export function useAdminInstructions({
  profile,
  initialInstructions,
  initialFolders,
  supabase,
  onCloseCreateInstruction,
  onCloseEditInstruction,
  onOpenEditInstruction,
  onCloseCreateFolder
}: UseAdminInstructionsOptions) {
  const [instructions, setInstructions] = useState<Instruction[]>(initialInstructions)
  const [instructionsHasMore, setInstructionsHasMore] = useState(initialInstructions.length >= PAGE_SIZE)
  const [instructionsLoadingMore, setInstructionsLoadingMore] = useState(false)
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [newFolderName, setNewFolderName] = useState('')
  const [newInstruction, setNewInstruction] = useState<NewInstructionState>({
    title: '',
    content: '',
    severity: 'medium',
    status: 'draft',
    folderId: '',
    teamIds: [],
    allTeams: false
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [editingInstruction, setEditingInstruction] = useState<Instruction | null>(null)
  const [editInstructionTitle, setEditInstructionTitle] = useState('')
  const [editInstructionContent, setEditInstructionContent] = useState('')
  const [editInstructionSeverity, setEditInstructionSeverity] = useState('')
  const [editInstructionStatus, setEditInstructionStatus] = useState('')
  const [editInstructionFolder, setEditInstructionFolder] = useState('')
  const [editInstructionTeams, setEditInstructionTeams] = useState<string[]>([])
  const [instructionLoading, setInstructionLoading] = useState(false)
  const [folderLoading, setFolderLoading] = useState(false)

  const createFolder = useCallback(async () => {
    if (!newFolderName.trim()) return
    setFolderLoading(true)

    try {
      const { data, error } = await supabase
        .from('folders')
        .insert({ name: newFolderName, org_id: profile.org_id })
        .select()
        .single()

      if (error) throw error

      setFolders(prev => [...prev, data])
      setNewFolderName('')
      onCloseCreateFolder?.()
      toast.success('Mappe opprettet')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'create_folder',
        entityType: 'folder',
        entityId: data.id,
        details: { folder_name: data.name }
      })
    } catch (error) {
      console.error('Create folder error:', error)
      toast.error('Kunne ikke opprette mappe. Prøv igjen.')
    } finally {
      setFolderLoading(false)
    }
  }, [newFolderName, onCloseCreateFolder, profile.id, profile.org_id, supabase])

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!confirm('Slette mappen? Instrukser i mappen beholdes.')) return

    try {
      const folderToDelete = folders.find(f => f.id === folderId)

      // Soft-delete: set deleted_at instead of hard delete
      const { error } = await supabase
        .from('folders')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', folderId)

      if (error) throw error

      setFolders(prev => prev.filter(f => f.id !== folderId))
      setInstructions(prev => prev.map(i =>
        i.folder_id === folderId ? { ...i, folder_id: null, folders: null } : i
      ))
      toast.success('Mappe slettet')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'delete_folder',
        entityType: 'folder',
        entityId: folderId,
        details: {
          folder_name: folderToDelete?.name || 'Ukjent',
          soft_delete: true
        }
      })
    } catch (error) {
      console.error('Delete folder error:', error)
      toast.error('Kunne ikke slette mappe. Prøv igjen.')
    }
  }, [folders, profile.id, profile.org_id, supabase])

  const createInstruction = useCallback(async () => {
    if (!newInstruction.title.trim()) return
    if (!newInstruction.allTeams && newInstruction.teamIds.length === 0) {
      toast.error('Velg minst ett team eller bruk Alle team')
      return
    }
    setInstructionLoading(true)

    try {
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
          setInstructionLoading(false)
          return
        }

        if (result.instruction) {
          const folder = folders.find(f => f.id === newInstruction.folderId)
          setInstructions(prev => [{
            ...result.instruction,
            folders: folder ? { name: folder.name } : null
          }, ...prev])

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
        const teamIdsToLink = newInstruction.allTeams ? [] : newInstruction.teamIds

        const response = await fetch('/api/instructions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: newInstruction.title,
            content: newInstruction.content,
            severity: newInstruction.severity,
            status: newInstruction.status,
            orgId: profile.org_id,
            folderId: newInstruction.folderId || null,
            teamIds: teamIdsToLink,
            allTeams: newInstruction.allTeams
          })
        })

        const result = await response.json()

        if (response.status >= 400 || result.error) {
          toast.error(result.error || 'Kunne ikke opprette instruks')
          setInstructionLoading(false)
          return
        }

        const data = result

        if (data) {
          setInstructions(prev => [data, ...prev])

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
      onCloseCreateInstruction?.()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Noe gikk galt')
    }

    setInstructionLoading(false)
  }, [folders, newInstruction, onCloseCreateInstruction, profile.id, profile.org_id, selectedFile, supabase])

  const deleteInstruction = useCallback(async (instructionId: string) => {
    if (!confirm('Slette instruksen? Instruksen arkiveres og kan gjenopprettes av support.')) return

    try {
      const instructionToDelete = instructions.find(i => i.id === instructionId)

      // Soft-delete: set deleted_at instead of hard delete (compliance)
      const { error } = await supabase
        .from('instructions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', instructionId)

      if (error) throw error

      setInstructions(prev => prev.filter(i => i.id !== instructionId))
      toast.success('Instruks slettet')

      await logAuditEventClient(supabase, {
        orgId: profile.org_id,
        userId: profile.id,
        actionType: 'delete_instruction',
        entityType: 'instruction',
        entityId: instructionId,
        details: {
          instruction_title: instructionToDelete?.title || 'Ukjent',
          severity: instructionToDelete?.severity || 'unknown',
          soft_delete: true
        }
      })
    } catch (error) {
      console.error('Delete instruction error:', error)
      toast.error('Kunne ikke slette instruks. Prøv igjen.')
    }
  }, [instructions, profile.id, profile.org_id, supabase])

  const toggleInstructionStatus = useCallback(async (instruction: Instruction) => {
    const newStatus = instruction.status === 'published' ? 'draft' : 'published'

    try {
      const { error } = await supabase
        .from('instructions')
        .update({ status: newStatus })
        .eq('id', instruction.id)

      if (error) throw error

      setInstructions(prev => prev.map(i =>
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
  }, [profile.id, profile.org_id, supabase])

  const openEditInstruction = useCallback(async (instruction: Instruction) => {
    setEditingInstruction(instruction)
    setEditInstructionTitle(instruction.title)
    setEditInstructionContent(instruction.content || '')
    setEditInstructionSeverity(instruction.severity)
    setEditInstructionStatus(instruction.status)
    setEditInstructionFolder(instruction.folder_id || '')

    // Load current team mappings
    const { data: teamMappings } = await supabase
      .from('instruction_teams')
      .select('team_id')
      .eq('instruction_id', instruction.id)

    setEditInstructionTeams(teamMappings?.map(t => t.team_id) || [])
    onOpenEditInstruction?.()
  }, [onOpenEditInstruction, supabase])

  const saveEditInstruction = useCallback(async () => {
    if (!editingInstruction) return
    setInstructionLoading(true)

    try {
      const wasPublished = editingInstruction.status === 'published'
      const willBePublished = editInstructionStatus === 'published'

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

      // Update team mappings
      // First delete existing mappings
      await supabase
        .from('instruction_teams')
        .delete()
        .eq('instruction_id', editingInstruction.id)

      // Then insert new mappings
      if (editInstructionTeams.length > 0) {
        await supabase
          .from('instruction_teams')
          .insert(editInstructionTeams.map(teamId => ({
            instruction_id: editingInstruction.id,
            team_id: teamId
          })))
      }

      setInstructions(prev => prev.map(i =>
        i.id === editingInstruction.id ? data : i
      ))
      setEditingInstruction(null)
      toast.success('Instruks oppdatert')
      onCloseEditInstruction?.()

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
      setInstructionLoading(false)
    }
  }, [
    editInstructionContent,
    editInstructionFolder,
    editInstructionSeverity,
    editInstructionStatus,
    editInstructionTeams,
    editInstructionTitle,
    editingInstruction,
    onCloseEditInstruction,
    profile.id,
    profile.org_id,
    supabase
  ])

  const filteredInstructions = useMemo(() => {
    return instructions.filter(i => {
      const folderMatch = selectedFolder === 'all'
        ? true
        : selectedFolder === 'none'
          ? !i.folder_id
          : i.folder_id === selectedFolder

      const statusMatch = statusFilter === 'all' ? true : i.status === statusFilter

      return folderMatch && statusMatch
    })
  }, [instructions, selectedFolder, statusFilter])



  const loadMoreInstructions = useCallback(async () => {
    if (instructionsLoadingMore || !instructionsHasMore) return
    setInstructionsLoadingMore(true)

    try {
      const offset = instructions.length
      const { data, error } = await supabase
        .from('instructions')
        .select('*, folders(*)')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) throw error

      const nextInstructions = data || []
      setInstructions(prev => [...prev, ...nextInstructions])
      setInstructionsHasMore(nextInstructions.length >= PAGE_SIZE)
    } catch (error) {
      console.error('Load more instructions error:', error)
      toast.error('Kunne ikke laste flere instrukser. Prøv igjen.')
    } finally {
      setInstructionsLoadingMore(false)
    }
  }, [instructions.length, instructionsHasMore, instructionsLoadingMore, profile.org_id, supabase])

  return {
    instructions,
    folders,
    selectedFolder,
    statusFilter,
    newFolderName,
    newInstruction,
    selectedFile,
    editingInstruction,
    editInstructionTitle,
    editInstructionContent,
    editInstructionSeverity,
    editInstructionStatus,
    editInstructionFolder,
    editInstructionTeams,
    instructionLoading,
    folderLoading,
    instructionsHasMore,
    instructionsLoadingMore,
    filteredInstructions,
    setSelectedFolder,
    setStatusFilter,
    setNewFolderName,
    setNewInstruction,
    setSelectedFile,
    setEditInstructionTitle,
    setEditInstructionContent,
    setEditInstructionSeverity,
    setEditInstructionStatus,
    setEditInstructionFolder,
    setEditInstructionTeams,
    createFolder,
    deleteFolder,
    createInstruction,
    deleteInstruction,
    toggleInstructionStatus,
    openEditInstruction,
    saveEditInstruction,
    loadMoreInstructions
  }
}
