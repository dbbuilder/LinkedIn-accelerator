import { test, expect } from '@playwright/test'
import { AuthHelper, mockAuthentication } from '../helpers/auth'
import { APIМocks } from '../helpers/api-mocks'
import { testVentures } from '../fixtures/test-data'

test.describe('Venture Onboarding Flow', () => {
  let auth: AuthHelper
  let apiMocks: APIМocks

  test.beforeEach(async ({ page }) => {
    // Initialize helpers
    auth = new AuthHelper(page)
    apiMocks = new APIМocks(page)

    // Mock authentication to bypass Clerk
    await mockAuthentication(page)

    // Mock AI endpoints to avoid real API calls
    await apiMocks.mockAllAIEndpoints()

    // Navigate to app
    await page.goto('/dashboard')
  })

  test('should complete AI-powered venture creation flow', async ({ page }) => {
    // Click "New Venture" button
    await page.click('text=New Venture')

    // Should be on the new venture page
    await expect(page).toHaveURL(/\/ventures\/new/)

    // Should see the conversational UI
    await expect(page.locator('text=What\\'s your business called?')).toBeVisible()

    // Fill in business name
    await page.fill('input[id="ventureName"]', testVentures.techConsulting.name)

    // Fill in optional website
    await page.fill('input[id="website"]', testVentures.techConsulting.website)

    // Fill in description
    await page.fill('textarea[id="description"]', testVentures.techConsulting.description)

    // Click "Analyze with AI"
    await page.click('button:has-text("Analyze with AI")')

    // Should see analyzing state
    await expect(page.locator('text=Analyzing your business')).toBeVisible()

    // Wait for AI analysis to complete
    await expect(page.locator('text=Here\\'s what I found!')).toBeVisible({ timeout: 10000 })

    // Should see the insights
    await expect(page.locator('text=Technology Consulting')).toBeVisible()
    await expect(page.locator('text=CTOs')).toBeVisible()

    // Accept the insights
    await page.click('button:has-text("Accept All")')

    // Wait for creation
    await expect(page.locator('text=Creating your venture')).toBeVisible()

    // Should redirect to ventures list or venture detail page
    await expect(page).toHaveURL(/\/ventures/, { timeout: 15000 })

    // Venture should appear in the list
    await expect(page.locator(`text=${testVentures.techConsulting.name}`)).toBeVisible()
  })

  test('should allow manual venture creation without AI', async ({ page }) => {
    await page.click('text=New Venture')
    await expect(page).toHaveURL(/\/ventures\/new/)

    // Fill in business name
    await page.fill('input[id="ventureName"]', testVentures.fintech.name)

    // Click "Fill Manually Instead"
    await page.click('button:has-text("Fill Manually Instead")')

    // Should see manual form
    await expect(page.locator('text=Customize your venture details')).toBeVisible()

    // Fill in all required fields
    await page.fill('input[id="venture_name"]', testVentures.fintech.name)
    await page.fill('input[id="industry"]', testVentures.fintech.expectedIndustry)
    await page.fill('textarea[id="target_audience"]', 'Small business owners and accountants')
    await page.fill('textarea[id="unique_value_prop"]', 'Modern, intuitive financial management')
    await page.fill('textarea[id="key_offerings"]', 'Accounting, payroll, invoicing, reporting')

    // Submit form
    await page.click('button[type="submit"]:has-text("Create Venture")')

    // Should redirect to ventures list
    await expect(page).toHaveURL(/\/ventures/, { timeout: 15000 })
    await expect(page.locator(`text=${testVentures.fintech.name}`)).toBeVisible()
  })

  test('should allow customizing AI suggestions', async ({ page }) => {
    await page.click('text=New Venture')

    // Fill minimal info
    await page.fill('input[id="ventureName"]', testVentures.healthTech.name)
    await page.fill('textarea[id="description"]', testVentures.healthTech.description)

    // Analyze
    await page.click('button:has-text("Analyze with AI")')

    // Wait for insights
    await expect(page.locator('text=Here\\'s what I found!')).toBeVisible({ timeout: 10000 })

    // Click customize
    await page.click('button:has-text("Customize")')

    // Should see manual form with pre-filled AI suggestions
    await expect(page.locator('text=Customize your venture details')).toBeVisible()

    // Industry should be pre-filled
    const industryInput = page.locator('input[id="industry"]')
    await expect(industryInput).toHaveValue(/Technology/)

    // Modify a field
    await industryInput.clear()
    await industryInput.fill('Healthcare Technology')

    // Submit
    await page.click('button[type="submit"]:has-text("Create Venture")')

    await expect(page).toHaveURL(/\/ventures/, { timeout: 15000 })
  })

  test('should validate required fields', async ({ page }) => {
    await page.click('text=New Venture')

    // Try to analyze without business name
    await page.click('button:has-text("Analyze with AI")')

    // Button should be disabled
    const analyzeButton = page.locator('button:has-text("Analyze with AI")')
    await expect(analyzeButton).toBeDisabled()

    // Fill in name
    await page.fill('input[id="ventureName"]', 'Test')

    // Now button should be enabled
    await expect(analyzeButton).toBeEnabled()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/ventures', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Failed to create venture',
        }),
      })
    })

    await page.click('text=New Venture')
    await page.fill('input[id="ventureName"]', 'Test Venture')
    await page.click('button:has-text("Fill Manually Instead")')

    // Fill form
    await page.fill('input[id="venture_name"]', 'Test')
    await page.fill('input[id="industry"]', 'Tech')
    await page.fill('textarea[id="target_audience"]', 'Developers')
    await page.fill('textarea[id="unique_value_prop"]', 'Innovation')
    await page.fill('textarea[id="key_offerings"]', 'Software')

    // Submit
    await page.click('button[type="submit"]:has-text("Create Venture")')

    // Should show error (alert or error message)
    // Wait for alert dialog
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Failed')
      await dialog.accept()
    })

    // Should still be on the form
    await expect(page).toHaveURL(/\/ventures\/new/)
  })
})

test.describe('Venture Onboarding - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

  test('should work on mobile viewport', async ({ page }) => {
    await mockAuthentication(page)
    const apiMocks = new APIМocks(page)
    await apiMocks.mockAllAIEndpoints()

    await page.goto('/dashboard')

    // Hamburger menu should be visible on mobile
    await expect(page.locator('button[aria-label="Toggle menu"]')).toBeVisible()

    // Click hamburger menu
    await page.click('button[aria-label="Toggle menu"]')

    // Wait for mobile menu to open
    await expect(page.locator('text=Ventures')).toBeVisible()

    // Click Ventures in mobile menu
    await page.click('text=Ventures')

    // Should navigate to ventures
    await expect(page).toHaveURL(/\/ventures/)

    // New Venture button should be full-width on mobile
    const newVentureButton = page.locator('a:has-text("New Venture")')
    await expect(newVentureButton).toBeVisible()

    // Click to create venture
    await newVentureButton.click()

    // Form should be responsive
    await expect(page.locator('input[id="ventureName"]')).toBeVisible()

    // Fill and submit
    await page.fill('input[id="ventureName"]', 'Mobile Test')
    await page.click('button:has-text("Fill Manually Instead")')

    // All form fields should be visible and usable on mobile
    await expect(page.locator('input[id="venture_name"]')).toBeVisible()
    await expect(page.locator('textarea[id="target_audience"]')).toBeVisible()
  })
})
