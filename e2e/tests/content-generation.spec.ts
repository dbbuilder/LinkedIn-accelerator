import { test, expect } from '@playwright/test'
import { mockAuthentication } from '../helpers/auth'
import { APIМocks } from '../helpers/api-mocks'
import { testContentTopics } from '../fixtures/test-data'

test.describe('Content Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthentication(page)
    const apiMocks = new APIМocks(page)
    await apiMocks.mockAllAIEndpoints()
    await page.goto('/dashboard')
  })

  test('should generate content with AI', async ({ page }) => {
    // Navigate to content generation
    await page.click('text=Generate Content')
    await expect(page).toHaveURL(/\/content\/new/)

    // Fill in topic
    await page.fill('textarea[placeholder*="topic"]', testContentTopics.aiTrends.topic)

    // Select tone
    await page.selectOption('select#tone', testContentTopics.aiTrends.tone)

    // Generate
    await page.click('button:has-text("Generate")')

    // Should show loading state
    await expect(page.locator('text=Generating')).toBeVisible()

    // Should show generated content
    await expect(page.locator('text=artificial intelligence')).toBeVisible({ timeout: 15000 })

    // Should show character count
    await expect(page.locator('text=/\\d+ characters/')).toBeVisible()

    // Should be able to approve
    await expect(page.locator('button:has-text("Approve")')).toBeVisible()
  })

  test('should display all generated content in list', async ({ page }) => {
    await page.click('text=Content')
    await expect(page).toHaveURL(/\/content$/)

    // Should show content stats
    await expect(page.locator('text=Total Content')).toBeVisible()
    await expect(page.locator('text=Drafts')).toBeVisible()

    // On desktop, should show table
    if (page.viewportSize()!.width >= 768) {
      await expect(page.locator('table')).toBeVisible()
    } else {
      // On mobile, should show cards
      await expect(page.locator('[class*="md:hidden"]')).toBeVisible()
    }
  })

  test('should allow editing generated content', async ({ page }) => {
    await page.goto('/content/new')

    await page.fill('textarea[placeholder*="topic"]', 'Test Topic')
    await page.selectOption('select#tone', 'professional')
    await page.click('button:has-text("Generate")')

    // Wait for content
    await expect(page.locator('textarea[name="content"]')).toBeVisible({ timeout: 15000 })

    // Edit the content
    const contentArea = page.locator('textarea[name="content"]')
    await contentArea.clear()
    await contentArea.fill('This is my edited content about AI and technology.')

    // Save
    await page.click('button:has-text("Save")')

    // Should show success feedback
    await expect(page.locator('text=/saved|success/i')).toBeVisible()
  })
})
