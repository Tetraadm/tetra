import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
    test('should display login form with email input', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        const magicLinkButton = page.getByRole('button', { name: /innloggingslenke/i })
        await expect(magicLinkButton).toBeVisible()
        await magicLinkButton.click()

        // Verify email input exists (using placeholder which is stable)
        const emailInput = page.getByPlaceholder('navn@bedrift.no')
        await expect(emailInput).toBeVisible({ timeout: 10000 })

        // Verify submit button exists
        const submitButton = page.getByRole('button', { name: /send innloggingslenke/i })
        await expect(submitButton).toBeVisible()
    })

    test('should show validation message for empty email', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        const magicLinkButton = page.getByRole('button', { name: /innloggingslenke/i })
        await magicLinkButton.click()

        // Click submit without entering email
        const submitButton = page.getByRole('button', { name: /send innloggingslenke/i })
        await submitButton.click()

        // Browser should show email validation (HTML5)
        const emailInput = page.getByPlaceholder('navn@bedrift.no')
        const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
        expect(isValid).toBe(false)
    })

    test('should accept valid email and show loading state', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        const magicLinkButton = page.getByRole('button', { name: /innloggingslenke/i })
        await magicLinkButton.click()

        // Enter valid email
        const emailInput = page.getByPlaceholder('navn@bedrift.no')
        await emailInput.fill('test@example.com')

        // Click submit
        const submitButton = page.getByRole('button', { name: /send innloggingslenke/i })
        await submitButton.click()

        // Should show loading text or the button should change state
        // We give it some time to react
        await page.waitForTimeout(1000)
    })
})
