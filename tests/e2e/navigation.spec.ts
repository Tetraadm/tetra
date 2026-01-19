import { test, expect } from '@playwright/test'

test.describe('Navigation', () => {
    test.describe('Unauthenticated User', () => {
        test('should see landing page at root', async ({ page }) => {
            await page.goto('/')

            // Wait for page to load
            await page.waitForLoadState('networkidle')

            // Check for landing page hero text
            await expect(page.getByText('Fremtidens plattform')).toBeVisible({ timeout: 10000 })

            // Check systems section exists
            await expect(page.getByText('Vårt Økosystem')).toBeVisible()
        })

        test('should see login page at /login', async ({ page }) => {
            await page.goto('/login')
            await page.waitForLoadState('networkidle')

            // Check for login form
            await expect(page.getByPlaceholder('navn@bedrift.no')).toBeVisible({ timeout: 10000 })
        })

        test('should redirect to login from protected routes', async ({ page }) => {
            // Admin route - middleware uses ?redirect= not ?next=
            await page.goto('/admin')
            await expect(page).toHaveURL(/\/login\?redirect=%2Fadmin/)

            // Employee route 
            await page.goto('/employee')
            await expect(page).toHaveURL(/\/login\?redirect=%2Femployee/)
        })
    })
})
