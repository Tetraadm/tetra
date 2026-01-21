/**
 * Shared TypeScript type definitions used across the application
 */

export type Role = 'admin' | 'teamleader' | 'employee'
export type Severity = 'critical' | 'medium' | 'low'
export type InstructionStatus = 'draft' | 'published'

export type Profile = {
  id: string
  full_name: string
  email?: string | null
  role: Role
  org_id: string
  team_id: string | null
}

export type Organization = {
  id: string
  name: string
}

export type Team = {
  id: string
  name: string
  org_id: string
}

export type Instruction = {
  id: string
  title: string
  content: string | null
  severity: Severity
  status: InstructionStatus
  folder_id: string | null
  file_path: string | null
  folders: { name: string } | null
}

export type Folder = {
  id: string
  name: string
}

export type Alert = {
  id: string
  title: string
  description: string | null
  severity: Severity
  active: boolean
  created_at: string
}

export type UnansweredQuestion = {
  id: string
  question: string
  created_at: string
  profiles?: { full_name: string } | null
}

export type ChatMessage = {
  type: 'user' | 'bot' | 'notfound'
  text: string
  source?: {
    instruction_id: string
    title: string
    updated_at: string | null
    open_url_or_route: string
  }
}
