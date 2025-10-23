import { Page, Route } from '@playwright/test'
import { mockAIResponses } from '../fixtures/test-data'

/**
 * API Mocking Utilities
 *
 * These helpers allow tests to mock API responses, especially for:
 * - OpenAI API calls (to avoid costs and ensure deterministic tests)
 * - External services
 * - Slow endpoints
 */

export class APIМocks {
  constructor(private page: Page) {}

  /**
   * Mock the AI venture analysis endpoint
   */
  async mockVentureAnalysis() {
    await this.page.route('**/api/dev-auth/ai/analyze-venture', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          insights: mockAIResponses.ventureAnalysis,
          warning: 'DEV MODE - No authentication required',
        }),
      })
    })
  }

  /**
   * Mock the AI content generation endpoint
   */
  async mockContentGeneration() {
    await this.page.route('**/api/dev-auth/ai/generate', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          draft: mockAIResponses.contentGeneration,
          metadata: {
            model: 'gpt-4o-mini',
            provider: 'openai',
            tone: 'professional',
            characterCount: mockAIResponses.contentGeneration.characterCount,
          },
          warning: 'DEV MODE - No authentication required',
        }),
      })
    })
  }

  /**
   * Mock the AI topic suggestions endpoint
   */
  async mockTopicSuggestions() {
    await this.page.route('**/api/dev-auth/ai/suggest-topics', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          topics: mockAIResponses.topicSuggestions,
          warning: 'DEV MODE - No authentication required',
        }),
      })
    })
  }

  /**
   * Mock all AI endpoints at once
   */
  async mockAllAIEndpoints() {
    await Promise.all([
      this.mockVentureAnalysis(),
      this.mockContentGeneration(),
      this.mockTopicSuggestions(),
    ])
  }

  /**
   * Intercept and log all API requests (useful for debugging)
   */
  async logAllAPIRequests() {
    this.page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log(`API Request: ${request.method()} ${request.url()}`)
      }
    })

    this.page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        console.log(`API Response: ${response.status()} ${response.url()}`)
      }
    })
  }

  /**
   * Wait for a specific API call to complete
   */
  async waitForAPICall(urlPattern: string | RegExp, options?: { timeout?: number }) {
    return await this.page.waitForResponse(
      (response) => {
        const url = response.url()
        const matches =
          typeof urlPattern === 'string' ? url.includes(urlPattern) : urlPattern.test(url)
        return matches && response.status() >= 200 && response.status() < 300
      },
      { timeout: options?.timeout || 30000 }
    )
  }

  /**
   * Mock database operations to return empty data (for clean slate testing)
   */
  async mockEmptyDatabase() {
    await this.page.route('**/api/ventures', async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      } else {
        await route.continue()
      }
    })

    await this.page.route('**/api/content', async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      } else {
        await route.continue()
      }
    })

    await this.page.route('**/api/prospects', async (route: Route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      } else {
        await route.continue()
      }
    })
  }

  /**
   * Clear all route mocks
   */
  async clearMocks() {
    await this.page.unroute('**/*')
  }
}

/**
 * Helper to create a mock with specific delays (for testing loading states)
 */
export async function mockWithDelay(
  page: Page,
  urlPattern: string | RegExp,
  responseBody: any,
  delayMs: number
) {
  await page.route(urlPattern, async (route: Route) => {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    })
  })
}

/**
 * Helper to mock an API error
 */
export async function mockAPIError(
  page: Page,
  urlPattern: string | RegExp,
  statusCode: number,
  errorMessage: string
) {
  await page.route(urlPattern, async (route: Route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: errorMessage,
      }),
    })
  })
}
