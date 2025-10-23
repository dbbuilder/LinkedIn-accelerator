# End-to-End Testing with Playwright

This document describes the E2E testing setup for the LinkedIn Accelerator application.

## Overview

We use [Playwright](https://playwright.dev/) for comprehensive end-to-end testing that validates the entire user journey through the application, including UI interactions and API calls.

## Test Architecture

### Structure

```
e2e/
├── fixtures/           # Test data and mock responses
│   └── test-data.ts    # Reusable test data
├── helpers/            # Utility functions for tests
│   ├── api-mocks.ts    # API mocking utilities
│   └── auth.ts         # Authentication helpers
└── tests/              # Test specifications
    ├── venture-onboarding.spec.ts
    ├── content-generation.spec.ts
    └── prospect-management.spec.ts
```

### Key Features

1. **Multi-Device Testing**: Tests run on desktop, tablet, and mobile viewports
2. **API Mocking**: AI endpoints (OpenAI) are mocked to ensure deterministic tests
3. **Authentication Mocking**: Clerk authentication is mocked for faster tests
4. **Visual Regression**: Screenshots and videos captured on failure
5. **Parallel Execution**: Tests run in parallel for speed

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug a specific test
npm run test:e2e:debug

# Generate new tests interactively
npm run test:e2e:codegen

# View last test report
npm run test:e2e:report
```

### CI/CD

Tests automatically run in GitHub Actions on every pull request:

```bash
# Run tests in CI mode
npm run test:e2e -- --project=chromium
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'
import { mockAuthentication } from '../helpers/auth'
import { APIМocks } from '../helpers/api-mocks'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await mockAuthentication(page)

    // Mock AI endpoints
    const apiMocks = new APIМocks(page)
    await apiMocks.mockAllAIEndpoints()

    // Navigate to starting point
    await page.goto('/dashboard')
  })

  test('should do something', async ({ page }) => {
    // Your test code here
    await page.click('text=Button')
    await expect(page.locator('text=Result')).toBeVisible()
  })
})
```

### Best Practices

1. **Use Mock Data**: Always use test data from `e2e/fixtures/test-data.ts`
2. **Mock AI Calls**: Never make real OpenAI API calls in tests
3. **Test User Flows**: Focus on complete user journeys, not individual components
4. **Handle Timing**: Use `waitForSelector` and `waitForURL` instead of arbitrary waits
5. **Clean Up**: Tests should be independent and not rely on previous test state

### Mobile Testing

```typescript
test.describe('Feature - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE

  test('should work on mobile', async ({ page }) => {
    // Mobile-specific test
  })
})
```

## API Mocking

### Why Mock?

- **Cost**: OpenAI API calls cost money
- **Speed**: Mocked responses are instant
- **Reliability**: No network dependencies
- **Determinism**: Same input always produces same output

### How to Mock

```typescript
import { APIМocks } from '../helpers/api-mocks'

const apiMocks = new APIМocks(page)

// Mock all AI endpoints at once
await apiMocks.mockAllAIEndpoints()

// Or mock individually
await apiMocks.mockVentureAnalysis()
await apiMocks.mockContentGeneration()
await apiMocks.mockTopicSuggestions()

// Mock with delay (test loading states)
await mockWithDelay(page, '**/api/ventures', mockData, 2000)

// Mock API errors
await mockAPIError(page, '**/api/content', 500, 'Server error')
```

## Authentication

### Mocked Authentication

For speed, tests use mocked authentication that bypasses Clerk:

```typescript
import { mockAuthentication } from '../helpers/auth'

await mockAuthentication(page)
```

### Real Authentication

For integration tests, use real Clerk authentication:

```typescript
import { AuthHelper } from '../helpers/auth'

const auth = new AuthHelper(page)
await auth.signIn('test@example.com', 'password')
```

**Note**: Real authentication requires test user credentials in environment variables.

## Test Data

All test data is centralized in `e2e/fixtures/test-data.ts`:

```typescript
import { testVentures, testProspects, testContentTopics } from '../fixtures/test-data'

// Use in tests
await page.fill('input[name="name"]', testVentures.techConsulting.name)
```

## Debugging

### Visual Debugging

```bash
# Run with UI mode for interactive debugging
npm run test:e2e:ui

# Run in headed mode to see browser
npm run test:e2e:headed

# Step through test with debugger
npm run test:e2e:debug
```

### Trace Viewer

Playwright automatically captures traces on failure. View them:

```bash
npx playwright show-trace trace.zip
```

### Screenshots & Videos

On test failure, screenshots and videos are automatically captured:
- Screenshots: `test-results/**/screenshot.png`
- Videos: `test-results/**/video.webm`

## CI/CD Integration

Tests run automatically in GitHub Actions:

```yaml
- name: Run Playwright tests
  run: npm run test:e2e
  env:
    PLAYWRIGHT_TEST_BASE_URL: http://localhost:3000
```

### Environment Variables

```bash
# .env.test.local
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
```

## Coverage

### What We Test

- ✅ Venture onboarding (AI-powered and manual)
- ✅ Content generation with AI
- ✅ Prospect management
- ✅ Navigation and routing
- ✅ Mobile responsiveness
- ✅ Error handling
- ✅ Loading states

### What We Don't Test

- ❌ Real OpenAI API calls (mocked)
- ❌ Real Clerk authentication (mocked)
- ❌ Database operations (use test database)
- ❌ Email sending (mocked)

## Troubleshooting

### Tests Timing Out

- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify mock responses are being returned

### Authentication Failures

- Ensure `mockAuthentication()` is called before navigation
- Check Clerk configuration in test environment

### Flaky Tests

- Add explicit waits: `await page.waitForSelector()`
- Use `waitForLoadState('networkidle')`
- Increase retry count in CI

### Debugging Failed CI Tests

1. Download test artifacts from GitHub Actions
2. View trace: `npx playwright show-trace trace.zip`
3. Check screenshots and videos

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Debugging](https://playwright.dev/docs/debug)

## Contributing

When adding new features:

1. Write E2E tests that cover the happy path
2. Test error scenarios
3. Test mobile responsiveness
4. Update this documentation if adding new patterns
