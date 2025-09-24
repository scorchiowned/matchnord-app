import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/test-helpers';
import testData from './fixtures/test-data.json';

test.describe('Basic Authentication Flow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should access frontpage and sign in with manager account', async ({
    page,
  }) => {
    // 1. Access frontpage
    await helpers.navigateTo('/fi');

    // Should show the Finnish homepage
    await expect(page).toHaveTitle(/Tournament Management System/);
    await expect(page.locator('h1')).toContainText('Turnaus Järjestelmä');

    // 2. Navigate directly to sign in page (more reliable than clicking)
    await helpers.navigateTo('/fi/auth/signin');

    // Should be on sign in page
    expect(helpers.getCurrentPath()).toContain('/auth/signin');
    await expect(page.locator('h3')).toContainText('Kirjaudu sisään');

    // 3. Sign in with manager account
    const manager = testData.users.teamManager;
    await page.getByRole('textbox', { name: 'Sähköposti' }).fill(manager.email);
    await page
      .getByRole('textbox', { name: 'Salasana' })
      .fill(manager.password);
    await page.getByRole('button', { name: 'Kirjaudu sisään' }).click();

    // Wait for sign-in to complete - either redirect or error message
    try {
      // Wait for either redirect to home page or error message
      await page.waitForURL('**/fi', { timeout: 10000 });
    } catch (error) {
      // If no redirect, check for error messages
      const errorMessage = page.locator('[role="alert"], .error, .toast');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('Sign-in error:', errorText);
      }
      throw error;
    }

    // Should be signed in successfully and redirected to home page
    const currentPath = helpers.getCurrentPath();
    console.log('Current path after sign in:', currentPath);

    // Should be back on the home page
    expect(currentPath).toBe('/fi');

    // Should show user is signed in - look for "Team Manager" link in navigation
    await expect(
      page.getByRole('link', { name: 'Team Manager' })
    ).toBeVisible();

    // Should show tournaments (since we're signed in as a team manager)
    await expect(
      page.getByRole('heading', { name: 'Turnaukset (4)' })
    ).toBeVisible();
  });
});
