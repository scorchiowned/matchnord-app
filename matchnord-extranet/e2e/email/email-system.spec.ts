import { test, expect } from '@playwright/test';
import {
  setupTestUser,
  cleanupTestData,
  setupTestInvitation,
} from '../utils/email-test-helpers';

test.describe('Email System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock email service to prevent actual emails
    await page.route('**/api/auth/verify-email', async (route) => {
      const request = route.request();
      const method = request.method();

      if (method === 'POST') {
        // Mock successful email sending
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Verification email sent successfully',
          }),
        });
      } else {
        // Let GET requests pass through for actual verification
        await route.continue();
      }
    });

    await page.route('**/api/auth/resend-verification', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Verification email sent successfully',
        }),
      });
    });
  });

  test.afterEach(async ({ page }) => {
    await cleanupTestData();
  });

  test('User Registration with Email Verification Flow', async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto('/auth/signup');

    // Step 2: Fill registration form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.selectOption('select[name="role"]', 'TEAM_MANAGER');

    // Step 3: Submit registration
    await page.click('button[type="submit"]');

    // Step 4: Verify redirect to verification page or success message
    await expect(page).toHaveURL(/.*auth.*verify.*|.*signin.*/);

    // Step 5: Check for verification message
    await expect(page.locator('text=verification email')).toBeVisible();

    // Step 6: Verify user was created in database (via API)
    const userResponse = await page.request.get(
      '/api/test/user/testuser@example.com'
    );
    expect(userResponse.ok()).toBeTruthy();

    const userData = await userResponse.json();
    expect(userData.email).toBe('testuser@example.com');
    expect(userData.emailVerified).toBeNull(); // Not verified yet
    expect(userData.isActive).toBe(false); // Not approved yet
  });

  test('Email Verification Page Functionality', async ({ page }) => {
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
    await page.goto(`/auth/verify-email?token=${token}`);

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

  test('Invalid Email Verification Token', async ({ page }) => {
    // Step 1: Navigate to verification page with invalid token
    await page.goto('/auth/verify-email?token=invalid-token');

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

  test('Expired Email Verification Token', async ({ page }) => {
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
    await page.goto(`/auth/verify-email?token=${token}`);

    // Step 4: Verify error for expired token
    await expect(page.locator('text=Verification Failed')).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.locator('text=Verification token has expired')
    ).toBeVisible();
  });

  test('Resend Verification Email', async ({ page }) => {
    // Step 1: Create unverified user
    const testUser = await setupTestUser({
      email: 'resendtest@example.com',
      name: 'Resend Test User',
      role: 'TEAM_MANAGER',
      emailVerified: null,
    });

    // Step 2: Navigate to signin page
    await page.goto('/auth/signin');

    // Step 3: Try to sign in with unverified email
    await page.fill('input[name="email"]', 'resendtest@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Step 4: Should show verification required message
    await expect(page.locator('text=Please verify your email')).toBeVisible();

    // Step 5: Click resend verification
    await page.click('text=Resend verification email');

    // Step 6: Verify success message
    await expect(page.locator('text=Verification email sent')).toBeVisible();
  });

  test('Team Registration with Approval Flow', async ({ page }) => {
    // Step 1: Create verified team manager
    const teamManager = await setupTestUser({
      email: 'teammanager@example.com',
      name: 'Team Manager',
      role: 'TEAM_MANAGER',
      emailVerified: new Date(),
      isActive: true,
    });

    // Step 2: Sign in as team manager
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'teammanager@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Step 3: Navigate to team registration
    await page.goto('/teams/new');

    // Step 4: Fill team registration form
    await page.fill('input[name="name"]', 'Test Team');
    await page.fill('input[name="club"]', 'Test Club');
    await page.fill('input[name="city"]', 'Test City');
    await page.selectOption('select[name="countryId"]', '1'); // Assuming country with ID 1 exists

    // Step 5: Submit registration
    await page.click('button[type="submit"]');

    // Step 6: Verify registration confirmation
    await expect(page.locator('text=Registration Confirmed')).toBeVisible();
    await expect(page.locator('text=pending approval')).toBeVisible();

    // Step 7: Verify registration was created in database
    const registrationResponse = await page.request.get(
      '/api/test/registrations/teammanager@example.com'
    );
    expect(registrationResponse.ok()).toBeTruthy();

    const registrations = await registrationResponse.json();
    expect(registrations.length).toBeGreaterThan(0);
    expect(registrations[0].status).toBe('PENDING');
  });

  test('Admin Approval Workflow', async ({ page }) => {
    // Step 1: Create admin user
    const admin = await setupTestUser({
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: new Date(),
      isActive: true,
    });

    // Step 2: Create pending team manager
    const teamManager = await setupTestUser({
      email: 'pendingmanager@example.com',
      name: 'Pending Manager',
      role: 'TEAM_MANAGER',
      emailVerified: new Date(),
      isActive: false, // Not approved yet
    });

    // Step 3: Sign in as admin
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Step 4: Navigate to admin approval page
    await page.goto('/admin/approvals');

    // Step 5: Verify pending user is listed
    await expect(page.locator('text=Pending Manager')).toBeVisible();
    await expect(page.locator('text=pendingmanager@example.com')).toBeVisible();

    // Step 6: Approve user
    await page.click('button:has-text("Approve")');

    // Step 7: Verify approval success
    await expect(page.locator('text=User approved successfully')).toBeVisible();

    // Step 8: Verify user is now active in database
    const userResponse = await page.request.get(
      `/api/test/user/${teamManager.id}`
    );
    const userData = await userResponse.json();
    expect(userData.isActive).toBe(true);
    expect(userData.approvedAt).not.toBeNull();
  });

  test('User Invitation System', async ({ page }) => {
    // Step 1: Create team manager
    const teamManager = await setupTestUser({
      email: 'inviter@example.com',
      name: 'Inviter Manager',
      role: 'TEAM_MANAGER',
      emailVerified: new Date(),
      isActive: true,
    });

    // Step 2: Sign in as team manager
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'inviter@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Step 3: Navigate to invitation page
    await page.goto('/admin/invite');

    // Step 4: Fill invitation form
    await page.fill('input[name="email"]', 'invited@example.com');
    await page.fill('input[name="name"]', 'Invited User');
    await page.selectOption('select[name="role"]', 'TOURNAMENT_MANAGER');

    // Step 5: Send invitation
    await page.click('button[type="submit"]');

    // Step 6: Verify invitation sent
    await expect(
      page.locator('text=Invitation sent successfully')
    ).toBeVisible();

    // Step 7: Verify invitation was created in database
    const invitationResponse = await page.request.get(
      '/api/test/invitations/invited@example.com'
    );
    expect(invitationResponse.ok()).toBeTruthy();

    const invitations = await invitationResponse.json();
    expect(invitations.length).toBeGreaterThan(0);
    expect(invitations[0].status).toBe('PENDING');
    expect(invitations[0].role).toBe('TOURNAMENT_MANAGER');
  });

  test('Invitation Acceptance Flow', async ({ page }) => {
    // Step 1: Create invitation
    const invitation = await setupTestInvitation({
      email: 'accepttest@example.com',
      role: 'REFEREE',
      inviterId: 'test-inviter-id',
    });

    // Step 2: Navigate to invitation acceptance page
    await page.goto(`/auth/accept-invitation?token=${invitation.token}`);

    // Step 3: Verify invitation details are displayed
    await expect(page.locator("text=You're Invited!")).toBeVisible();
    await expect(page.locator('text=Referee')).toBeVisible();

    // Step 4: Accept invitation
    await page.click('text=Accept Invitation');

    // Step 5: Should redirect to account setup
    await expect(page).toHaveURL(/.*auth.*setup.*/);

    // Step 6: Fill account setup form
    await page.fill('input[name="name"]', 'Accepted User');
    await page.fill('input[name="password"]', 'NewPassword123!');
    await page.fill('input[name="confirmPassword"]', 'NewPassword123!');

    // Step 7: Submit setup
    await page.click('button[type="submit"]');

    // Step 8: Verify account created and verified
    await expect(page).toHaveURL(/.*dashboard.*/);

    // Step 9: Verify user was created in database
    const userResponse = await page.request.get(
      '/api/test/user/accepttest@example.com'
    );
    const userData = await userResponse.json();
    expect(userData.email).toBe('accepttest@example.com');
    expect(userData.role).toBe('REFEREE');
    expect(userData.emailVerified).not.toBeNull();
  });
});
