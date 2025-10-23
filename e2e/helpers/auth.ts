import { Page } from '@playwright/test'

/**
 * Authentication Helpers for Clerk
 *
 * These utilities handle authentication flows in E2E tests.
 * For Clerk, we need to handle their hosted sign-in page.
 */

export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Sign in using Clerk's authentication
   *
   * NOTE: This assumes you have test credentials set up.
   * For production tests, use Clerk's test mode or create dedicated test users.
   */
  async signIn(email: string, password: string) {
    // Navigate to sign-in page
    await this.page.goto('/sign-in')

    // Wait for Clerk's sign-in form to load
    await this.page.waitForSelector('input[name="identifier"]', { timeout: 10000 })

    // Fill in email
    await this.page.fill('input[name="identifier"]', email)
    await this.page.click('button[type="submit"]')

    // Wait for password field (Clerk shows it after email)
    await this.page.waitForSelector('input[name="password"]', { timeout: 5000 })

    // Fill in password
    await this.page.fill('input[name="password"]', password)
    await this.page.click('button[type="submit"]')

    // Wait for successful authentication - should redirect to dashboard
    await this.page.waitForURL('**/dashboard', { timeout: 10000 })
  }

  /**
   * Alternative: Use Clerk's session token directly (faster for tests)
   *
   * This bypasses the UI and sets the auth cookie directly.
   * Requires having a valid Clerk session token.
   */
  async signInWithToken(sessionToken: string) {
    await this.page.context().addCookies([
      {
        name: '__session',
        value: sessionToken,
        domain: new URL(this.page.url()).hostname,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
      },
    ])

    // Navigate to dashboard to confirm auth
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Sign out
   */
  async signOut() {
    // Click user button in navigation
    await this.page.click('[data-testid="user-button"], .cl-userButton-root')

    // Click sign out
    await this.page.click('text=Sign out')

    // Wait for redirect to home or sign-in page
    await this.page.waitForURL(/\/(sign-in|$)/, { timeout: 5000 })
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Try to navigate to dashboard
      await this.page.goto('/dashboard', { timeout: 5000 })

      // If we're on the dashboard, we're authenticated
      const url = this.page.url()
      return url.includes('/dashboard')
    } catch {
      return false
    }
  }

  /**
   * Get user ID from the page (if authenticated)
   */
  async getUserId(): Promise<string | null> {
    try {
      // This assumes there's a way to get the user ID from the page
      // You might need to adjust this based on your app's implementation
      const userId = await this.page.evaluate(() => {
        return (window as any).__CLERK_USER_ID__ || null
      })
      return userId
    } catch {
      return null
    }
  }
}

/**
 * Mock authentication for testing without real Clerk accounts
 *
 * This bypasses Clerk authentication entirely for faster tests.
 * Only use in development/test environments!
 */
export async function mockAuthentication(page: Page) {
  // Intercept Clerk API calls and mock them
  await page.route('**/api.clerk.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'test-user-id',
          email_addresses: [{ email_address: 'test@example.com' }],
          first_name: 'Test',
          last_name: 'User',
        },
        session: {
          id: 'test-session-id',
          user_id: 'test-user-id',
        },
      }),
    })
  })

  // Mock the auth check
  await page.addInitScript(() => {
    (window as any).__CLERK_USER_ID__ = 'test-user-id'
  })
}

/**
 * Wait for authentication to complete
 */
export async function waitForAuth(page: Page, options?: { timeout?: number }) {
  await page.waitForFunction(
    () => {
      // Check if Clerk has loaded and user is authenticated
      const clerk = (window as any).Clerk
      return clerk && clerk.user !== null && clerk.user !== undefined
    },
    { timeout: options?.timeout || 10000 }
  )
}
