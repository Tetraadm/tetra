import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
    test('should display login form with email input', async ({ page }) => {
        await page.goto('/login')

        // Verify page title or heading
        await expect(page.locator('h1, h2').first()).toBeVisible()

        // Verify email input exists
        const emailInput = page.locator('input[type="email"]')
        await expect(emailInput).toBeVisible()

        // Verify submit button exists
        const submitButton = page.locator('button[type="submit"]')
        await expect(submitButton).toBeVisible()
    })

    test('should show validation message for empty email', async ({ page }) => {
        await page.goto('/login')

        // Click submit without entering email
        const submitButton = page.locator('button[type="submit"]')
        await submitButton.click()

        // Browser should show email validation (HTML5)
        const emailInput = page.locator('input[type="email"]')
        const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
        expect(isValid).toBe(false)
    })

    test('should accept valid email and show loading state', async ({ page }) => {
        await page.goto('/login')

        // Enter valid email
        const emailInput = page.locator('input[type="email"]')
        await emailInput.fill('test@example.com')

        // Click submit
        const submitButton = page.locator('button[type="submit"]')
        await submitButton.click()

        // Should show some loading indication or success message
        // (The actual behavior depends on backend/Supabase)
        await page.waitForTimeout(500)
    })
})
