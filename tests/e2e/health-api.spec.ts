import { test, expect } from '@playwright/test'

test.describe('API Health Check', () => {
    test('GET /api/health should return ok', async ({ request }) => {
        const response = await request.get('/api/health')

        // Check status code
        expect(response.status()).toBe(200)

        // Check response body
        const body = await response.json()
        expect(body).toMatchObject({
            status: 'healthy',
            checks: {
                database: { status: 'ok' }
            }
        })

        // Verify timestamp exists
        expect(body.timestamp).toBeDefined()
    })
})
