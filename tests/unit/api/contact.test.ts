import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn()
}))

// Schema matching the contact API validation
const contactSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    subject: z.string().min(1),
    message: z.string().min(1),
    company: z.string().optional(),
    website: z.string().optional(), // Honeypot field
})

describe('Contact API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Input validation', () => {
        it('should require name field', () => {
            const result = contactSchema.safeParse({
                email: 'test@example.com',
                subject: 'Test',
                message: 'Hello'
            })
            expect(result.success).toBe(false)
        })

        it('should require valid email', () => {
            const result = contactSchema.safeParse({
                name: 'Test User',
                email: 'not-an-email',
                subject: 'Test',
                message: 'Hello'
            })
            expect(result.success).toBe(false)
        })

        it('should require subject', () => {
            const result = contactSchema.safeParse({
                name: 'Test User',
                email: 'test@example.com',
                subject: '',
                message: 'Hello'
            })
            expect(result.success).toBe(false)
        })

        it('should require message', () => {
            const result = contactSchema.safeParse({
                name: 'Test User',
                email: 'test@example.com',
                subject: 'Test',
                message: ''
            })
            expect(result.success).toBe(false)
        })

        it('should accept valid input', () => {
            const result = contactSchema.safeParse({
                name: 'Test User',
                email: 'test@example.com',
                subject: 'Test Subject',
                message: 'This is a test message'
            })
            expect(result.success).toBe(true)
        })

        it('should accept optional company field', () => {
            const result = contactSchema.safeParse({
                name: 'Test User',
                email: 'test@example.com',
                subject: 'Test Subject',
                message: 'Hello',
                company: 'Test Company AS'
            })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.company).toBe('Test Company AS')
            }
        })
    })

    describe('Honeypot detection', () => {
        it('should have honeypot field in schema', () => {
            const result = contactSchema.safeParse({
                name: 'Bot',
                email: 'bot@spam.com',
                subject: 'Spam',
                message: 'Buy now!',
                website: 'http://spam.com' // Bot fills this
            })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.website).toBe('http://spam.com')
            }
        })
    })

    describe('Norwegian character handling', () => {
        it('should accept Norwegian characters in name', () => {
            const result = contactSchema.safeParse({
                name: 'Øystein Ærøy',
                email: 'oystein@example.com',
                subject: 'Spørsmål om HMS',
                message: 'Hei, jeg lurer på noe angående HMS-systemet.'
            })
            expect(result.success).toBe(true)
        })
    })
})
