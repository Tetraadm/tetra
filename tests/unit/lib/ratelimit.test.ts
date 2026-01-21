import { describe, it, expect } from 'vitest'
import { getRateLimiterStatus } from '@/lib/ratelimit'

describe('getRateLimiterStatus', () => {
    it('should return configuration status', () => {
        const status = getRateLimiterStatus()

        expect(status).toHaveProperty('isConfigured')
        expect(status).toHaveProperty('isProduction')
        expect(status).toHaveProperty('provider')
        expect(['upstash', 'in-memory', 'misconfigured']).toContain(status.provider)
    })

    it('should report in-memory in development without Upstash', () => {
        // In test environment without Upstash configured
        const status = getRateLimiterStatus()

        if (!status.isConfigured && !status.isProduction) {
            expect(status.provider).toBe('in-memory')
        }
    })
})
