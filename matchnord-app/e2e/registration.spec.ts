import { test, expect } from '@playwright/test';

const TOURNAMENT_ID = 'cmg1tk8z4000marfd6rneywbs';
const REGISTRATION_URL = `/fi/tournaments/${TOURNAMENT_ID}/register`;

test.describe('Tournament Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REGISTRATION_URL);
  });

  test('should load the registration page successfully', async ({ page }) => {
    // Check that the main form elements are present
    await expect(page.locator('h1')).toContainText('Kasiysi Syysturnaus 2025');
    await expect(page.locator('text=Team Registration Form')).toBeVisible();
  });

  test('should display division information with level, birth year, and format', async ({ page }) => {
    // Click on the division dropdown to open it
    await page.click('[data-testid="division-select"]');
    
    // Check that division information is displayed with level, birth year, and format
    const divisionOption = page.locator('[data-testid="division-option"]').first();
    await expect(divisionOption).toBeVisible();
    
    // Check that the division shows level, birth year, and format
    await expect(divisionOption).toContainText('ELITE');
    await expect(divisionOption).toContainText('Born 2015');
    await expect(divisionOption).toContainText('8v8');
  });

  test('should have all required form fields', async ({ page }) => {
    // Team Information
    await expect(page.locator('[data-testid="club-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="division-select"]')).toBeVisible();
    
    // Contact Person Information
    await expect(page.locator('[data-testid="contact-first-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-last-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-address-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-postal-code-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-city-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-phone-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-email-input"]')).toBeVisible();
    
    // Terms checkbox
    await expect(page.locator('[data-testid="accept-terms-checkbox"]')).toBeVisible();
  });

  test('should have both submit buttons', async ({ page }) => {
    // Check for regular submit button
    await expect(page.locator('[data-testid="submit-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="submit-button"]')).toContainText('Lähetä ilmoittautuminen');
    
    // Check for "Save and Create Another" button
    await expect(page.locator('[data-testid="save-and-create-another-button"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Check that submit button is disabled when form is empty
    await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();
    
    // Fill some fields but leave others empty
    await page.fill('[data-testid="club-input"]', 'Test Club');
    // Leave team name empty
    
    // Check that submit button is still disabled
    await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();
  });

  test('should show success message when using "Save and Create Another"', async ({ page }) => {
    // Fill out the form with test data
    await page.fill('[data-testid="club-input"]', 'Test Club');
    await page.fill('[data-testid="team-name-input"]', 'Test Team');
    await page.click('[data-testid="division-select"]');
    await page.click('[data-testid="division-option"]:first-child');
    
    await page.fill('[data-testid="contact-first-name-input"]', 'John');
    await page.fill('[data-testid="contact-last-name-input"]', 'Doe');
    await page.fill('[data-testid="contact-address-input"]', 'Test Street 1');
    await page.fill('[data-testid="contact-postal-code-input"]', '00100');
    await page.fill('[data-testid="contact-city-input"]', 'Helsinki');
    await page.fill('[data-testid="contact-phone-input"]', '+358401234567');
    await page.fill('[data-testid="contact-email-input"]', 'test@example.com');
    
    // Accept terms
    await page.check('[data-testid="accept-terms-checkbox"]');
    
    // Verify that both buttons are now enabled
    await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="save-and-create-another-button"]')).toBeEnabled();
    
    // Click "Save and Create Another" button
    await page.click('[data-testid="save-and-create-another-button"]');
    
    // Wait a moment for any potential form reset
    await page.waitForTimeout(1000);
    
    // Check that form is reset (division and team name cleared, but contact info preserved)
    await expect(page.locator('[data-testid="team-name-input"]')).toHaveValue('');
    await expect(page.locator('[data-testid="contact-first-name-input"]')).toHaveValue('John');
    await expect(page.locator('[data-testid="contact-last-name-input"]')).toHaveValue('Doe');
  });

  test('should preserve form data when using "Save and Create Another"', async ({ page }) => {
    // Fill out the form with test data
    await page.fill('[data-testid="club-input"]', 'Test Club');
    await page.fill('[data-testid="team-name-input"]', 'Test Team 1');
    await page.click('[data-testid="division-select"]');
    await page.click('[data-testid="division-option"]:first-child');
    
    await page.fill('[data-testid="contact-first-name-input"]', 'Jane');
    await page.fill('[data-testid="contact-last-name-input"]', 'Smith');
    await page.fill('[data-testid="contact-address-input"]', 'Test Avenue 2');
    await page.fill('[data-testid="contact-postal-code-input"]', '00200');
    await page.fill('[data-testid="contact-city-input"]', 'Tampere');
    await page.fill('[data-testid="contact-phone-input"]', '+358501234567');
    await page.fill('[data-testid="contact-email-input"]', 'jane@example.com');
    
    // Fill billing information
    await page.fill('[data-testid="billing-name-input"]', 'Billing Company');
    await page.fill('[data-testid="billing-address-input"]', 'Billing Street 3');
    await page.fill('[data-testid="billing-postal-code-input"]', '00300');
    await page.fill('[data-testid="billing-city-input"]', 'Turku');
    await page.fill('[data-testid="billing-email-input"]', 'billing@example.com');
    
    // Accept terms
    await page.check('[data-testid="accept-terms-checkbox"]');
    
    // Click "Save and Create Another" button
    await page.click('[data-testid="save-and-create-another-button"]');
    
    // Wait a moment for any potential form reset
    await page.waitForTimeout(1000);
    
    // Check that only division and team name are cleared
    await expect(page.locator('[data-testid="team-name-input"]')).toHaveValue('');
    
    // Check that all other data is preserved
    await expect(page.locator('[data-testid="club-input"]')).toHaveValue('Test Club');
    await expect(page.locator('[data-testid="contact-first-name-input"]')).toHaveValue('Jane');
    await expect(page.locator('[data-testid="contact-last-name-input"]')).toHaveValue('Smith');
    await expect(page.locator('[data-testid="contact-address-input"]')).toHaveValue('Test Avenue 2');
    await expect(page.locator('[data-testid="contact-postal-code-input"]')).toHaveValue('00200');
    await expect(page.locator('[data-testid="contact-city-input"]')).toHaveValue('Tampere');
    await expect(page.locator('[data-testid="contact-phone-input"]')).toHaveValue('+358501234567');
    await expect(page.locator('[data-testid="contact-email-input"]')).toHaveValue('jane@example.com');
    await expect(page.locator('[data-testid="billing-name-input"]')).toHaveValue('Billing Company');
    await expect(page.locator('[data-testid="billing-address-input"]')).toHaveValue('Billing Street 3');
    await expect(page.locator('[data-testid="billing-postal-code-input"]')).toHaveValue('00300');
    await expect(page.locator('[data-testid="billing-city-input"]')).toHaveValue('Turku');
    await expect(page.locator('[data-testid="billing-email-input"]')).toHaveValue('billing@example.com');
    
    // Check that terms are still accepted
    await expect(page.locator('[data-testid="accept-terms-checkbox"]')).toBeChecked();
  });

  test('should disable submit buttons when terms are not accepted', async ({ page }) => {
    // Fill out some form data
    await page.fill('[data-testid="club-input"]', 'Test Club');
    await page.fill('[data-testid="team-name-input"]', 'Test Team');
    
    // Check that buttons are disabled without terms acceptance
    await expect(page.locator('[data-testid="submit-button"]')).toBeDisabled();
    await expect(page.locator('[data-testid="save-and-create-another-button"]')).toBeDisabled();
    
    // Accept terms
    await page.check('[data-testid="accept-terms-checkbox"]');
    
    // Check that buttons are now enabled
    await expect(page.locator('[data-testid="submit-button"]')).toBeEnabled();
    await expect(page.locator('[data-testid="save-and-create-another-button"]')).toBeEnabled();
  });

  test('should show loading state during submission', async ({ page }) => {
    // Fill out the form
    await page.fill('[data-testid="club-input"]', 'Test Club');
    await page.fill('[data-testid="team-name-input"]', 'Test Team');
    await page.click('[data-testid="division-select"]');
    await page.click('[data-testid="division-option"]:first-child');
    await page.fill('[data-testid="contact-first-name-input"]', 'John');
    await page.fill('[data-testid="contact-last-name-input"]', 'Doe');
    await page.fill('[data-testid="contact-address-input"]', 'Test Street 1');
    await page.fill('[data-testid="contact-postal-code-input"]', '00100');
    await page.fill('[data-testid="contact-city-input"]', 'Helsinki');
    await page.fill('[data-testid="contact-phone-input"]', '+358401234567');
    await page.fill('[data-testid="contact-email-input"]', 'test@example.com');
    await page.check('[data-testid="accept-terms-checkbox"]');
    
    // Click submit and check for loading state
    await page.click('[data-testid="submit-button"]');
    
    // Check that loading state is shown on the submit button
    await expect(page.locator('[data-testid="submit-button"]:has-text("Submitting...")')).toBeVisible();
  });
});
