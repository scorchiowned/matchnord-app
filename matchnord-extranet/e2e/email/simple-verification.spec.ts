import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../utils/email-test-helpers';

test.describe('Simple Email Verification Tests', () => {
  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('Email Verification Page with Valid Token - Real Test', async ({
    page,
  }) => {
    // Step 1: Create a test user
    const testUser = await setupTestUser({
      email: 'realtest@example.com',
      name: 'Real Test User',
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

    // Step 4: Wait for verification to complete (longer timeout)
    await expect(page.locator('text=Email Verified!')).toBeVisible({
      timeout: 15000,
    });

    // Step 5: Verify success message
    await expect(
      page.locator('text=Your email has been successfully verified')
    ).toBeVisible();

    // Step 6: Verify user details are displayed
    await expect(page.locator('text=Real Test User')).toBeVisible();
    await expect(page.locator('text=realtest@example.com')).toBeVisible();
    await expect(page.locator('text=Team Manager')).toBeVisible();

    // Step 7: Test continue button
    await page.click('text=Continue to Sign In');
    await expect(page).toHaveURL(/.*auth.*signin.*/);

    // Step 8: Verify user is now verified in database
    const userResponse = await page.request.get(
      `/api/test/user/${testUser.id}`
    );
    const userData = await userResponse.json();
    expect(userData.emailVerified).not.toBeNull();
  });

  test('Email Verification API Test', async ({ page }) => {
    // Step 1: Create test user
    const testUser = await setupTestUser({
      email: 'apitest@example.com',
      name: 'API Test User',
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

    // Step 3: Test verification API endpoint
    const verifyResponse = await page.request.get(
      `/api/auth/verify-email?token=${token}`
    );

    expect(verifyResponse.ok()).toBeTruthy();
    const verifyData = await verifyResponse.json();
    expect(verifyData.message).toBe('Email verified successfully');
    expect(verifyData.user.email).toBe('apitest@example.com');

    // Step 4: Verify user is now verified in database
    const userResponse = await page.request.get(
      `/api/test/user/${testUser.id}`
    );
    const userData = await userResponse.json();
    expect(userData.emailVerified).not.toBeNull();
  });
});
