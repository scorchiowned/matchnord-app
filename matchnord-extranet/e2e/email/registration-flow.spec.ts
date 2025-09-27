import { test, expect } from '@playwright/test';
import { cleanupTestData } from '../utils/email-test-helpers';

test.describe('User Registration Flow', () => {
  test.afterEach(async () => {
    await cleanupTestData();
  });

  test('Complete User Registration and Email Verification Flow', async ({
    page,
  }) => {
    // Step 1: Navigate to signup page
    await page.goto('/fi/auth/signup');

    // Step 2: Fill registration form
    const uniqueEmail = `registrationtest-${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Test Registration User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');
    await page.selectOption('select[aria-hidden="true"]', 'TEAM_MANAGER');

    // Step 3: Submit registration
    await page.click('button[type="submit"]');

    // Step 4: Wait for redirect to verify-request page (this indicates successful registration)
    await expect(page).toHaveURL(/.*\/.*\/auth\/verify-request.*/, {
      timeout: 10000,
    });

    // Step 5: Verify the verify-request page shows correct message
    await expect(page.locator('h3:has-text("Check Your Email")')).toBeVisible();
    await expect(
      page.locator("text=We've sent you a verification email")
    ).toBeVisible();

    // Step 6: Verify user was created in database
    const userResponse = await page.request.get(
      `/api/test/user/${uniqueEmail}`
    );
    expect(userResponse.ok()).toBeTruthy();

    const userData = await userResponse.json();
    expect(userData.email).toBe(uniqueEmail);
    expect(userData.name).toBe('Test Registration User');
    expect(userData.role).toBe('TEAM_MANAGER');
    expect(userData.emailVerified).toBeNull(); // Not verified yet
    expect(userData.isActive).toBe(false); // Team managers need approval
  });

  test('Registration Form Validation', async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto('/en/auth/signup');

    // Step 2: Try to submit empty form
    await page.click('button[type="submit"]');

    // Step 3: Verify validation errors
    await expect(page.locator('input[name="name"]:invalid')).toBeVisible();
    await expect(page.locator('input[name="email"]:invalid')).toBeVisible();
    await expect(page.locator('input[name="password"]:invalid')).toBeVisible();
  });

  test('Password Mismatch Validation', async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto('/en/auth/signup');

    // Step 2: Fill form with mismatched passwords
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');

    // Step 3: Submit form
    await page.click('button[type="submit"]');

    // Step 4: Verify error message
    await expect(
      page.locator('.rounded-lg.bg-red-50:has-text("Passwords do not match")')
    ).toBeVisible();
  });

  test('Duplicate Email Registration', async ({ page }) => {
    // Step 1: Create a user first
    await page.request.post('/api/auth/register', {
      data: {
        name: 'Existing User',
        email: 'duplicate@example.com',
        password: 'TestPassword123!',
        role: 'TEAM_MANAGER',
      },
    });

    // Step 2: Navigate to signup page
    await page.goto('/en/auth/signup');

    // Step 3: Try to register with same email
    await page.fill('input[name="name"]', 'Another User');
    await page.fill('input[name="email"]', 'duplicate@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    // Step 4: Submit form
    await page.click('button[type="submit"]');

    // Step 5: Verify error message
    await expect(
      page.locator(
        '.rounded-lg.bg-red-50:has-text("User with this email already exists")'
      )
    ).toBeVisible();
  });
});
