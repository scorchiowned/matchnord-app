import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../utils/email-test-helpers';

test.describe('UI Email Verification Tests', () => {
  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('Email Verification Page UI Flow', async ({ page }) => {
    // Step 1: Create a test user
    const testUser = await setupTestUser({
      email: 'uitest@example.com',
      name: 'UI Test User',
      role: 'TEAM_MANAGER',
      emailVerified: null,
    });

    // Step 2: Create verification token
    const tokenResponse = await page.request.post(
      '/api/test/create-verification-token',
      {
        data: { userId: testUser.id },
      }
    );
    const { token } = await tokenResponse.json();

    // Step 3: Navigate to verification page with token
    await page.goto(`/en/auth/verify-email?token=${token}`);

    // Step 4: Wait for loading state
    await expect(page.locator('text=Verifying your email')).toBeVisible();

    // Step 5: Wait for verification to complete
    await expect(page.locator('text=Email Verified!')).toBeVisible({
      timeout: 20000,
    });

    // Step 6: Verify success message
    await expect(
      page.locator('text=Your email has been successfully verified')
    ).toBeVisible();

    // Step 7: Verify user details are displayed
    await expect(page.locator('text=UI Test User')).toBeVisible();
    await expect(page.locator('text=uitest@example.com')).toBeVisible();
    await expect(page.locator('text=Team Manager')).toBeVisible();

    // Step 8: Test continue button
    await page.click('text=Continue to Sign In');
    await expect(page).toHaveURL(/.*auth.*signin.*/);
  });
});
