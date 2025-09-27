import { test, expect } from '@playwright/test';

test.describe('Debug Registration Error', () => {
  test('Debug Registration Form Error', async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto('/en/auth/signup');

    // Step 2: Wait for page to load
    await page.waitForLoadState('networkidle');

    // Step 3: Fill registration form
    await page.fill('input[name="name"]', 'Debug Test User');
    await page.fill('input[name="email"]', 'debugtest2@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    // Step 4: Select role using the hidden select element
    await page.selectOption('select[aria-hidden="true"]', 'TEAM_MANAGER');

    // Step 5: Listen for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Step 6: Listen for network responses
    const networkResponses: any[] = [];
    page.on('response', (response) => {
      if (response.url().includes('/api/auth/register')) {
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    // Step 7: Submit form
    await page.click('button[type="submit"]');

    // Step 8: Wait for any network activity
    await page.waitForTimeout(5000);

    // Step 9: Check for errors
    console.log('Console errors:', consoleErrors);
    console.log('Network responses:', networkResponses);

    // Step 10: Check what's on the page
    const errorElements = await page.locator('.rounded-lg.bg-red-50').all();
    if (errorElements.length > 0) {
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log('Error message on page:', errorText);
      }
    }

    // Step 11: Take screenshot
    await page.screenshot({ path: 'debug-registration-error.png' });

    // Step 12: Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
  });
});
