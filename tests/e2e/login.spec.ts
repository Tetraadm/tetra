import { test, expect } from '@playwright/test'

test.describe('Login Page', () => {
    test('should display login form with email and password inputs', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // Verify email input exists
        const emailInput = page.getByPlaceholder('navn@bedrift.no')
        await expect(emailInput).toBeVisible({ timeout: 10000 })

        // Verify password input exists
        const passwordInput = page.getByPlaceholder('Skriv inn passord')
        await expect(passwordInput).toBeVisible()

        // Verify submit button exists
        const submitButton = page.getByRole('button', { name: /logg inn/i })
        await expect(submitButton).toBeVisible()
    })

    test('should show validation for empty form submission', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // Click submit without entering credentials
        const submitButton = page.getByRole('button', { name: /logg inn/i })
        await submitButton.click()

        // Browser should show email validation (HTML5)
        const emailInput = page.getByPlaceholder('navn@bedrift.no')
        const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
        expect(isValid).toBe(false)
    })

    test('should show error for invalid credentials', async ({ page }) => {
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // Enter invalid credentials
        await page.getByPlaceholder('navn@bedrift.no').fill('invalid@test.com')
        await page.getByPlaceholder('Skriv inn passord').fill('wrongpassword')

        // Click submit
        const submitButton = page.getByRole('button', { name: /logg inn/i })
        await submitButton.click()

        // Should show error message
        await expect(page.getByText(/feil e-post eller passord/i)).toBeVisible({ timeout: 10000 })
    })
})
