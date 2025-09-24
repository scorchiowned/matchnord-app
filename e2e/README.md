# End-to-End Testing with Playwright

This directory contains end-to-end tests for the tournament management application using Playwright.

## Test Structure

```
e2e/
├── auth/                    # Authentication tests
├── tournaments/             # Tournament-related tests
├── teams/                   # Team management tests
├── admin/                   # Admin interface tests
├── public/                  # Public-facing page tests
├── fixtures/                # Test data and fixtures
├── utils/                   # Test utilities and helpers
└── setup/                   # Global setup and teardown
```

## Running Tests

### Basic Commands

```bash
# Run all e2e tests
npm run e2e

# Run tests with UI (interactive mode)
npm run e2e:ui

# Run tests in headed mode (see browser)
npm run e2e:headed

# Debug tests step by step
npm run e2e:debug

# Show test report
npm run e2e:report

# Install Playwright browsers
npm run e2e:install
```

### Running Specific Tests

```bash
# Run specific test file
npx playwright test auth/signin.spec.ts

# Run tests matching a pattern
npx playwright test --grep "tournament creation"

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Data

Test data is defined in `fixtures/test-data.json` and includes:

- **Users**: Different user roles (admin, team manager, referee, regular user)
- **Tournaments**: Sample tournament data
- **Teams**: Sample team information
- **Venues**: Sample venue data

## Test Utilities

The `utils/test-helpers.ts` file provides common utilities:

- `signIn()` - Sign in with credentials
- `signOut()` - Sign out from application
- `navigateTo()` - Navigate to pages
- `fillFieldByLabel()` - Fill form fields
- `waitForToast()` - Wait for notifications
- `takeScreenshot()` - Take screenshots for debugging

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import testData from '../fixtures/test-data.json';

test.describe('Feature Name', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    // Setup code here
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```

### Best Practices

1. **Use data-testid attributes** in your components for reliable selectors
2. **Wait for elements** to be visible before interacting
3. **Use the TestHelpers** for common operations
4. **Take screenshots** when debugging failing tests
5. **Group related tests** in describe blocks
6. **Clean up** after tests when necessary

### Example Component with Test IDs

```tsx
<button data-testid="create-tournament-button">
  Create Tournament
</button>

<div data-testid="tournament-list">
  {tournaments.map(tournament => (
    <div key={tournament.id} data-testid="tournament-card">
      {tournament.name}
    </div>
  ))}
</div>
```

## Configuration

The Playwright configuration is in `playwright.config.ts` and includes:

- **Multiple browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Global setup/teardown**: For test data management
- **Screenshots and videos**: On test failures
- **Trace files**: For debugging
- **Web server**: Automatically starts the dev server

## Debugging

### Visual Debugging

```bash
# Run with UI to see tests visually
npm run e2e:ui

# Run in headed mode to see browser
npm run e2e:headed

# Debug specific test
npx playwright test auth/signin.spec.ts --debug
```

### Screenshots and Videos

- Screenshots are automatically taken on test failures
- Videos are recorded for failed tests
- Trace files are generated for debugging

### Common Issues

1. **Timing issues**: Use `waitFor()` instead of `sleep()`
2. **Element not found**: Check if element is visible and has correct selector
3. **Authentication**: Ensure test users exist in database
4. **Data cleanup**: Make sure tests don't interfere with each other

## CI/CD Integration

The tests are configured to run in CI environments with:

- Reduced parallelism for stability
- Retry logic for flaky tests
- Proper cleanup after test runs
- Artifact collection for failed tests
