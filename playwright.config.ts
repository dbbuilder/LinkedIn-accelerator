import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'path'

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test.local') })

/**
 * Playwright E2E Testing Configuration
 *
 * This configuration provides comprehensive end-to-end testing:
 * - Desktop and mobile viewport testing
 * - Parallel test execution for speed
 * - Automatic retries for flaky tests
 * - Video and screenshot capture on failure
 * - API request interception and mocking
 */
export default defineConfig({
  testDir: './e2e',

  // Maximum time one test can run
  timeout: 60 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],

  // Shared test configuration
  use: {
    // Base URL for all tests
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    // Collect trace on failure for debugging
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Action timeout
    actionTimeout: 15 * 1000,

    // Navigation timeout
    navigationTimeout: 30 * 1000,
  },

  // Test projects for different browsers and viewports
  projects: [
    // Desktop Chrome
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },

    // Mobile Chrome (iPhone 12)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['iPhone 12'],
      },
    },

    // Tablet (iPad)
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },

    // Small mobile (iPhone SE)
    {
      name: 'mobile-small',
      use: {
        ...devices['iPhone SE'],
      },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
