import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
    test.describe('Unauthenticated User', () => {
        test('should see landing page at root', async ({ page }) => {
            await page.goto('/')

            // Wait for page to load
            await page.waitForLoadState('networkidle')

            // Check for landing page hero text
            await expect(page.getByRole('heading', { name: /Sikker HMS-styring/i })).toBeVisible({ timeout: 10000 })

            // Check systems section exists
            await expect(page.getByRole('heading', { name: /Systemer for trygg drift/i })).toBeVisible()
        })

        test('should see login page at /login', async ({ page }) => {
            await page.goto('/login')
            await page.waitForLoadState('networkidle')

            // Check for login form
            await expect(page.getByRole('button', { name: /innloggingslenke/i })).toBeVisible({ timeout: 10000 })
        })

        test('should redirect to login from protected routes', async ({ page }) => {
            // Admin route - middleware uses ?redirect= not ?next=
            await page.goto('/instructions/admin')
            await expect(page).toHaveURL(/\/login\?redirect=%2Finstructions%2Fadmin/)

            // Portal route
            await page.goto('/portal')
            await expect(page).toHaveURL(/\/login\?redirect=%2Fportal/)
        })
    })
})
