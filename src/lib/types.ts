/**
 * Shared TypeScript type definitions used across the application
 */

export type Profile = {
  id: string
  full_name: string
  email?: string | null
  role: string
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
  severity: string
  status: string
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
  severity: string
  active: boolean
  created_at: string
}

export type AiLog = {
  id: string
  question: string
  answer: string
  created_at: string
  instructions: { title: string } | null
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
