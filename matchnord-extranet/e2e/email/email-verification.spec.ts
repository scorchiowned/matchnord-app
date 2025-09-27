import { test, expect } from '@playwright/test';
import { setupTestUser, cleanupTestData } from '../utils/email-test-helpers';

test.describe('Email Verification Tests', () => {
  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('Email Verification Page with Valid Token', async ({ page }) => {
    // Step 1: Create a test user with verification token
    const testUser = await setupTestUser({
      email: 'verifytest@example.com',
      name: 'Verify Test User',
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

    // Step 4: Verify loading state
    await expect(page.locator('text=Verifying your email')).toBeVisible();

    // Step 5: Wait for verification to complete
    await expect(page.locator('text=Email Verified!')).toBeVisible({
      timeout: 10000,
    });

    // Step 6: Verify success message and user details
    await expect(
      page.locator('text=Your email has been successfully verified')
    ).toBeVisible();
    await expect(page.locator('text=Verify Test User')).toBeVisible();
    await expect(page.locator('text=verifytest@example.com')).toBeVisible();
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

  test('Email Verification Page with Invalid Token', async ({ page }) => {
    // Step 1: Navigate to verification page with invalid token
    await page.goto('/en/auth/verify-email?token=invalid-token');

    // Step 2: Wait for error state
    await expect(page.locator('text=Verification Failed')).toBeVisible({
      timeout: 10000,
    });

    // Step 3: Verify error message
    await expect(page.locator('text=Invalid verification token')).toBeVisible();

    // Step 4: Test back to sign in button
    await page.click('text=Back to Sign In');
    await expect(page).toHaveURL(/.*auth.*signin.*/);
  });

  test('Email Verification Page with Expired Token', async ({ page }) => {
    // Step 1: Create test user
    const testUser = await setupTestUser({
      email: 'expiredtest@example.com',
      name: 'Expired Test User',
      role: 'TEAM_MANAGER',
    });

    // Step 2: Create expired token
    const tokenResponse = await page.request.post(
      '/api/test/create-expired-token',
      {
        data: { userId: testUser.id },
      }
    );
    const { token } = await tokenResponse.json();

    // Step 3: Navigate to verification page
    await page.goto(`/en/auth/verify-email?token=${token}`);

    // Step 4: Verify error for expired token
    await expect(page.locator('text=Verification Failed')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('text=Verification token has expired')
    ).toBeVisible();
  });

  test('Email Verification Page without Token', async ({ page }) => {
    // Step 1: Navigate to verification page without token
    await page.goto('/en/auth/verify-email');

    // Step 2: Should show error for missing token
    await expect(page.locator('text=Verification Failed')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('text=No verification token provided')
    ).toBeVisible();
  });

  test('Email Verification API Endpoint', async ({ page }) => {
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

  test('Resend Verification Email API', async ({ page }) => {
    // Step 1: Create unverified user
    const testUser = await setupTestUser({
      email: 'resendtest@example.com',
      name: 'Resend Test User',
      role: 'TEAM_MANAGER',
      emailVerified: null,
    });

    // Step 2: Test resend verification API
    const resendResponse = await page.request.post(
      '/api/auth/resend-verification',
      {
        data: { email: 'resendtest@example.com' },
      }
    );

    expect(resendResponse.ok()).toBeTruthy();
    const resendData = await resendResponse.json();
    expect(resendData.message).toBe('Verification email sent successfully');
  });
});
