import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { logAuditEventClient } from '@/lib/audit-log'
import type { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

type SupabaseClient = ReturnType<typeof createClient>

type UseAdminUsersOptions = {
  profile: Profile
  initialUsers: Profile[]
  supabase: SupabaseClient
  onInviteCompleted?: () => void
  onEditCompleted?: () => void
  onOpenEdit?: () => void
}

export function useAdminUsers({
  profile,
  initialUsers,
  supabase,
  onInviteCompleted,
  onEditCompleted,
  onOpenEdit
}: UseAdminUsersOptions) {
  const [users, setUsers] = useState<Profile[]>(initialUsers)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('employee')
  const [inviteTeam, setInviteTeam] = useState('')
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [editUserRole, setEditUserRole] = useState('')
  const [editUserTeam, setEditUserTeam] = useState('')
  const [userLoading, setUserLoading] = useState(false)

  const deleteUser = useCallback(async (userId: string) => {
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

      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('Bruker fjernet')

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
  }, [profile.id, profile.org_id, supabase, users])

  const openEditUser = useCallback((user: Profile) => {
    setEditingUser(user)
    setEditUserRole(user.role)
    setEditUserTeam(user.team_id || '')
    onOpenEdit?.()
  }, [onOpenEdit])

  const saveEditUser = useCallback(async () => {
    if (!editingUser) return
    setUserLoading(true)

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

      setUsers(prev => prev.map(u =>
        u.id === editingUser.id
          ? { ...u, role: editUserRole, team_id: editUserTeam || null }
          : u
      ))
      toast.success('Bruker oppdatert')

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
      onEditCompleted?.()
    } catch (error) {
      console.error('Save edit user error:', error)
      toast.error('Kunne ikke oppdatere bruker. Prøv igjen.')
    } finally {
      setUserLoading(false)
    }
  }, [editUserRole, editUserTeam, editingUser, profile.id, profile.org_id, supabase, onEditCompleted])

  const inviteUser = useCallback(async () => {
    if (!inviteEmail.trim()) return
    setUserLoading(true)

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
      onInviteCompleted?.()
    } catch (error) {
      console.error('Invite user error:', error)
      toast.error('Kunne ikke opprette invitasjon. Prøv igjen.')
    } finally {
      setUserLoading(false)
    }
  }, [inviteEmail, inviteRole, inviteTeam, profile.id, profile.org_id, supabase, onInviteCompleted])

  return {
    users,
    setUsers,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteTeam,
    setInviteTeam,
    editingUser,
    editUserRole,
    setEditUserRole,
    editUserTeam,
    setEditUserTeam,
    userLoading,
    deleteUser,
    openEditUser,
    saveEditUser,
    inviteUser
  }
}
