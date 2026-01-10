import type { Profile, Team, Instruction, Folder, Alert } from '@/lib/types'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Shared types for AdminDashboard and its sub-components
 */

export type TabType =
  | 'oversikt'
  | 'brukere'
  | 'team'
  | 'instrukser'
  | 'avvik'
  | 'ailogg'
  | 'innsikt'
  | 'auditlog'
  | 'lesebekreftelser'

export type AdminDashboardData = {
  teams: Team[]
  users: Profile[]
  instructions: Instruction[]
  folders: Folder[]
  alerts: Alert[]
}

export type AdminDashboardHandlers = {
  setTeams: (teams: Team[]) => void
  setUsers: (users: Profile[]) => void
  setInstructions: (instructions: Instruction[]) => void
  setFolders: (folders: Folder[]) => void
  setAlerts: (alerts: Alert[]) => void
}

export type SharedAdminProps = {
  profile: Profile
  supabase: SupabaseClient
  data: AdminDashboardData
  handlers: AdminDashboardHandlers
}
