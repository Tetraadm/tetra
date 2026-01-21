import { describe, it, expect } from 'vitest'
import { sanitizeEmail, sanitizePII } from '@/lib/audit-log'

describe('sanitizeEmail', () => {
    it('should redact email address correctly', () => {
        expect(sanitizeEmail('john.doe@example.com')).toBe('j***@example.com')
    })

    it('should handle single character local part', () => {
        expect(sanitizeEmail('a@example.com')).toBe('a***@example.com')
    })

    it('should handle empty/invalid email', () => {
        expect(sanitizeEmail('')).toBe('***')
        expect(sanitizeEmail('invalid')).toBe('***')
    })

    it('should preserve domain', () => {
        const result = sanitizeEmail('user@tetrivo.com')
        expect(result).toContain('@tetrivo.com')
    })
})

describe('sanitizePII', () => {
    it('should sanitize email fields in object', () => {
        const input = {
            name: 'John Doe',
            email: 'john.doe@example.com',
            role: 'admin'
        }
        const result = sanitizePII(input)

        expect(result.name).toBe('John Doe')
        expect(result.email).toBe('j***@example.com')
        expect(result.role).toBe('admin')
    })

    it('should sanitize nested objects', () => {
        const input = {
            action: 'invite_user',
            details: {
                inviteeEmail: 'invited@example.com',
                teamId: '123'
            }
        }
        const result = sanitizePII(input)

        expect((result.details as Record<string, unknown>).inviteeEmail).toBe('i***@example.com')
        expect((result.details as Record<string, unknown>).teamId).toBe('123')
    })

    it('should handle all common PII field names', () => {
        const input = {
            email: 'a@b.com',
            inviteeEmail: 'c@d.com',
            user_email: 'e@f.com',
            userEmail: 'g@h.com',
            unrelated: 'safe'
        }
        const result = sanitizePII(input)

        expect(result.email).toBe('a***@b.com')
        expect(result.inviteeEmail).toBe('c***@d.com')
        expect(result.user_email).toBe('e***@f.com')
        expect(result.userEmail).toBe('g***@h.com')
        expect(result.unrelated).toBe('safe')
    })

    it('should not modify arrays', () => {
        const input = {
            items: ['a', 'b', 'c']
        }
        const result = sanitizePII(input)

        expect(result.items).toEqual(['a', 'b', 'c'])
    })
})
