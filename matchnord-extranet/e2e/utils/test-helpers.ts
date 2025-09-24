import { Page, expect } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    await this.page.goto('/fi/auth/signin');

    // Try test ID first, then fall back to role-based selectors
    const emailInput = this.page
      .getByTestId('signin-email-input')
      .or(this.page.getByRole('textbox', { name: 'Sähköposti' }));
    const passwordInput = this.page
      .getByTestId('signin-password-input')
      .or(this.page.getByRole('textbox', { name: 'Salasana' }));
    const submitButton = this.page
      .getByTestId('signin-submit-button')
      .or(this.page.getByRole('button', { name: 'Kirjaudu sisään' }));

    await emailInput.fill(email);
    await passwordInput.fill(password);
    await submitButton.click();

    // Wait for successful sign-in by checking for redirect or success indicators
    try {
      // Wait for either redirect to home page or error message
      await this.page.waitForURL('**/fi', { timeout: 10000 });
    } catch (error) {
      // If no redirect, check for error messages
      const errorMessage = this.page.locator(
        '[role="alert"], .error, .toast, .text-red-600'
      );
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('Sign-in error:', errorText);
        throw new Error(`Sign-in failed: ${errorText}`);
      }
      throw error;
    }

    await this.waitForPageLoad();
  }

  /**
   * Sign out from the application
   */
  async signOut() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="sign-out"]');
    await this.waitForPageLoad();
  }

  /**
   * Navigate to a specific page and wait for it to load
   */
  async navigateTo(path: string) {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Fill a form field by label
   */
  async fillFieldByLabel(label: string, value: string) {
    const field = this.page.locator(
      `label:has-text("${label}") + input, label:has-text("${label}") + textarea, label:has-text("${label}") + select`
    );
    await field.fill(value);
  }

  /**
   * Select an option from a dropdown by label
   */
  async selectOptionByLabel(label: string, option: string) {
    const select = this.page.locator(`label:has-text("${label}") + select`);
    await select.selectOption(option);
  }

  /**
   * Click a button by text
   */
  async clickButtonByText(text: string) {
    await this.page.click(`button:has-text("${text}")`);
  }

  /**
   * Wait for a toast notification to appear
   */
  async waitForToast(message?: string) {
    const toast = this.page.locator(
      '[data-testid="toast"], .toast, [role="alert"]'
    );
    await toast.waitFor({ state: 'visible' });
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  /**
   * Wait for a loading spinner to disappear
   */
  async waitForLoadingToFinish() {
    await this.page.waitForSelector('[data-testid="loading"], .loading', {
      state: 'hidden',
    });
  }

  /**
   * Take a screenshot for debugging
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `e2e/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="user-menu"]', {
        timeout: 2000,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current URL path
   */
  getCurrentPath(): string {
    return new URL(this.page.url()).pathname;
  }

  /**
   * Wait for API response
   */
  async waitForApiResponse(urlPattern: string | RegExp) {
    await this.page.waitForResponse(urlPattern);
  }

  /**
   * Mock API response
   */
  async mockApiResponse(url: string, response: any) {
    await this.page.route(url, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    });
  }
}
