import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
    test.describe('Unauthenticated User', () => {
        test('should redirect root to login', async ({ page }) => {
            await page.goto('/')
            await page.waitForLoadState('networkidle')

            // Root redirects to /login
            await expect(page).toHaveURL('/login')
        })

        test('should see login page at /login', async ({ page }) => {
            await page.goto('/login')
            await page.waitForLoadState('networkidle')

            // Check for login form with password input
            await expect(page.getByRole('button', { name: /logg inn/i })).toBeVisible({ timeout: 10000 })
        })

        test('should redirect to login from protected routes', async ({ page }) => {
            // Admin route - middleware uses ?redirect=
            await page.goto('/instructions/admin')
            await expect(page).toHaveURL(/\/login\?redirect=%2Finstructions%2Fadmin/)

            // Portal route
            await page.goto('/portal')
            await expect(page).toHaveURL(/\/login\?redirect=%2Fportal/)
        })
    })
})
