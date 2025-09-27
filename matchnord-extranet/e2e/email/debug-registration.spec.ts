import { test, expect } from '@playwright/test';

test.describe('Debug Registration Flow', () => {
  test('Debug Registration Form Submission', async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto('/en/auth/signup');

    // Step 2: Wait for page to load
    await page.waitForLoadState('networkidle');

    // Step 3: Fill registration form
    await page.fill('input[name="name"]', 'Debug Test User');
    await page.fill('input[name="email"]', 'debugtest@example.com');
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!');

    // Step 4: Select role using the hidden select element
    await page.selectOption('select[aria-hidden="true"]', 'TEAM_MANAGER');

    // Step 5: Take screenshot before submission
    await page.screenshot({ path: 'debug-before-submit.png' });

    // Step 6: Submit form
    await page.click('button[type="submit"]');

    // Step 7: Wait a bit and take screenshot after submission
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'debug-after-submit.png' });

    // Step 8: Check what's on the page
    const pageContent = await page.content();
    console.log(
      'Page content after submission:',
      pageContent.substring(0, 1000)
    );

    // Step 9: Check for any error messages
    const errorElements = await page.locator('.rounded-lg.bg-red-50').all();
    if (errorElements.length > 0) {
      for (let i = 0; i < errorElements.length; i++) {
        const errorText = await errorElements[i].textContent();
        console.log('Error message:', errorText);
      }
    }

    // Step 10: Check for success messages
    const successElements = await page.locator('.rounded-lg.bg-green-50').all();
    if (successElements.length > 0) {
      for (let i = 0; i < successElements.length; i++) {
        const successText = await successElements[i].textContent();
        console.log('Success message:', successText);
      }
    }

    // Step 11: Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
  });
});
