import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function for conditional class names
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Format date for display
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('nb-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        ...options,
    })
}

// Format date with time
export function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('nb-NO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// Relative time (e.g., "2 timer siden")
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'Akkurat nå'
    if (diffMins < 60) return `${diffMins} min siden`
    if (diffHours < 24) return `${diffHours} timer siden`
    if (diffDays < 7) return `${diffDays} dager siden`
    return formatDate(d)
}

// Truncate text
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength - 3) + '...'
}

// Get initials from name
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// Priority label mapping
export const priorityLabels = {
    critical: 'Kritisk',
    high: 'Høy',
    medium: 'Medium',
    low: 'Lav',
} as const

// Role label mapping
export const roleLabels = {
    admin: 'Administrator',
    teamleader: 'Teamleder',
    ansatt: 'Ansatt',
} as const

// Status label mapping
export const statusLabels = {
    unread: 'Ulest',
    read: 'Lest',
    confirmed: 'Kvittert',
    published: 'Publisert',
    draft: 'Utkast',
    archived: 'Arkivert',
} as const

// Audit action labels
export const auditActionLabels = {
    viewed: 'Vist',
    confirmed: 'Kvittert',
    created: 'Opprettet',
    updated: 'Oppdatert',
    deleted: 'Slettet',
    published: 'Publisert',
    archived: 'Arkivert',
    invited: 'Invitert',
    role_changed: 'Rolle endret',
    login: 'Innlogget',
    logout: 'Utlogget',
    anonymized: 'Anonymisert',
    exported: 'Eksportert',
    create_instruction: 'Opprettet instruks',
    update_instruction: 'Oppdaterte instruks',
    publish_instruction: 'Publiserte instruks',
    unpublish_instruction: 'Avpubliserte instruks',
    delete_instruction: 'Slettet instruks',
    create_alert: 'Opprettet varsel',
    update_alert: 'Oppdaterte varsel',
    toggle_alert: 'Endret varselstatus',
    delete_alert: 'Slettet varsel',
    create_folder: 'Opprettet mappe',
    delete_folder: 'Slettet mappe',
    create_team: 'Opprettet team',
    delete_team: 'Slettet team',
    create_user: 'Opprettet bruker',
    edit_user: 'Endret bruker',
    delete_user: 'Slettet bruker',
    invite_user: 'Inviterte bruker',
    change_role: 'Endret rolle',
} as const
