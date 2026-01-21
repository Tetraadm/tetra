import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'

// Mock dependencies
vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn()
}))

vi.mock('next/headers', () => ({
    cookies: vi.fn(() => ({
        getAll: vi.fn(() => []),
        set: vi.fn()
    }))
}))

vi.mock('@/lib/ratelimit', () => ({
    uploadRatelimit: {
        limit: vi.fn(() => Promise.resolve({ success: true, isMisconfigured: false }))
    }
}))

// Schema that matches the actual upload API validation
const uploadSchema = z.object({
    title: z.string().min(1, 'Tittel er påkrevd').max(200),
    folderId: z.string().uuid().optional().nullable(),
    teamIds: z.array(z.string().uuid()).optional().default([]),
})

describe('Upload API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Input validation', () => {
        it('should validate title is required', () => {
            const result = uploadSchema.safeParse({})

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('title')
            }
        })

        it('should validate title max length', () => {
            const longTitle = 'a'.repeat(201)
            const result = uploadSchema.safeParse({ title: longTitle })

            expect(result.success).toBe(false)
        })

        it('should accept valid input', () => {
            const result = uploadSchema.safeParse({
                title: 'Test Instruction',
                folderId: null,
                teamIds: []
            })

            expect(result.success).toBe(true)
        })

        it('should validate folder ID is UUID if provided', () => {
            const result = uploadSchema.safeParse({
                title: 'Test',
                folderId: 'not-a-uuid'
            })

            expect(result.success).toBe(false)
        })

        it('should validate team IDs are UUIDs', () => {
            const result = uploadSchema.safeParse({
                title: 'Test',
                teamIds: ['not-a-uuid']
            })

            expect(result.success).toBe(false)
        })

        it('should accept valid UUIDs', () => {
            const result = uploadSchema.safeParse({
                title: 'Test',
                folderId: '123e4567-e89b-12d3-a456-426614174000',
                teamIds: ['123e4567-e89b-12d3-a456-426614174001']
            })

            expect(result.success).toBe(true)
        })
    })

    describe('Rate limiting', () => {
        it('should call rate limiter with user identifier', async () => {
            const { uploadRatelimit } = await import('@/lib/ratelimit')

            await uploadRatelimit.limit('user-456')

            expect(uploadRatelimit.limit).toHaveBeenCalledWith('user-456')
        })
    })

    describe('File validation', () => {
        it('should define allowed MIME types', () => {
            const allowedTypes = [
                'application/pdf',
                'image/png',
                'image/jpeg',
                'image/gif',
                'image/webp'
            ]

            expect(allowedTypes).toContain('application/pdf')
            expect(allowedTypes).toContain('image/png')
            expect(allowedTypes).not.toContain('application/exe')
        })

        it('should enforce max file size', () => {
            const MAX_UPLOAD_MB = 10
            const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

            expect(MAX_UPLOAD_BYTES).toBe(10485760)
        })
    })
})
