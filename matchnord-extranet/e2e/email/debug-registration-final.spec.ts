import { test, expect } from '@playwright/test';

test.describe('Debug Registration Final', () => {
  test('Debug Registration Form Final', async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto('/en/auth/signup');

    // Step 2: Wait for page to load
    await page.waitForLoadState('networkidle');

    // Step 3: Fill registration form with unique email
    const uniqueEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', uniqueEmail);
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

    // Step 8: Wait for any network activity and state changes
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

    const successElements = await page.locator('.rounded-lg.bg-green-50').all();
    if (successElements.length > 0) {
      for (let i = 0; i < successElements.length; i++) {
        const successText = await successElements[i].textContent();
        console.log('Success message on page:', successText);
      }
    }

    // Step 11: Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Step 12: Check if form is still visible (indicating no redirect)
    const formVisible = await page.locator('form').isVisible();
    console.log('Form still visible:', formVisible);

    // Step 13: Check if submit button is disabled
    const submitButton = page.locator('button[type="submit"]');
    const isDisabled = await submitButton.isDisabled();
    console.log('Submit button disabled:', isDisabled);

    // Step 14: Take screenshot
    await page.screenshot({ path: 'debug-registration-final.png' });
  });
});
