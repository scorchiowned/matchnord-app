import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import testData from '../fixtures/test-data.json';

test.describe('Tournament Management', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should navigate to tournaments and render tournaments correctly', async ({
    page,
  }) => {
    // Sign in as team manager first
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // Navigate to tournaments page
    await helpers.navigateTo('/fi/tournaments');

    // Should be on tournaments page
    expect(helpers.getCurrentPath()).toContain('/tournaments');

    // Should show tournaments heading
    await expect(
      page.getByRole('heading', { name: 'Turnaukset' })
    ).toBeVisible();

    // Should show the "Luo turnaus" (Create Tournament) link
    const createButton = page
      .getByTestId('create-tournament-button')
      .or(page.getByRole('link', { name: 'Luo turnaus' }));
    await expect(createButton).toBeVisible();

    // Should show tournament table with correct headers using test IDs
    await expect(page.getByTestId('tournament-title-header')).toBeVisible();
    await expect(
      page.getByTestId('tournament-organization-header')
    ).toBeVisible();
    await expect(page.getByTestId('tournament-dates-header')).toBeVisible();
    await expect(page.getByTestId('tournament-teams-header')).toBeVisible();
    await expect(page.getByTestId('tournament-venues-header')).toBeVisible();
    await expect(page.getByTestId('tournament-status-header')).toBeVisible();
    await expect(page.getByTestId('tournament-actions-header')).toBeVisible();

    // Should show existing tournaments in the table
    const tournamentRows = page.locator('tbody tr');
    await expect(tournamentRows.first()).toBeVisible();

    // Should show tournament names (check for any tournament name)
    await expect(page.locator('tbody tr').first()).toContainText(
      /asdasd|Tournament|Turnaus|Championship|Cup|Manager|Youth/
    );
  });

  test('should create new tournament with required information and save it', async ({
    page,
  }) => {
    const tournament = testData.tournaments.sampleTournament;

    // Sign in as team manager first
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // Navigate to tournaments list first
    await helpers.navigateTo('/fi/tournaments');

    // Click the "Luo turnaus" (Create Tournament) link
    const createButton = page
      .getByTestId('create-tournament-button')
      .or(page.getByRole('link', { name: 'Luo turnaus' }));
    await createButton.click();

    // Wait for navigation to complete
    await page.waitForURL('**/tournaments/new');
    await page.waitForLoadState('networkidle');

    // Should be on create tournament page
    const currentPath = helpers.getCurrentPath();
    console.log('Current path on tournament creation page:', currentPath);
    expect(currentPath).toContain('/tournaments/new');

    // Should show tournament creation form
    await expect(
      page.getByRole('heading', { name: 'Luo turnaus' })
    ).toBeVisible();

    // Fill required tournament information using test IDs
    await page.getByTestId('tournament-name-input').fill(tournament.name);
    await page.getByTestId('tournament-season-input').fill('2025');
    await page
      .getByTestId('tournament-start-date-input')
      .fill(tournament.startDate);
    await page
      .getByTestId('tournament-end-date-input')
      .fill(tournament.endDate);
    // Country is auto-selected by the form, so we can skip this step
    await page.getByTestId('tournament-city-input').fill('Test City');
    await page.getByTestId('tournament-address-input').fill('Test Address');
    await page
      .getByTestId('tournament-contact-email-input')
      .fill('contact@test.com');
    await page.getByTestId('tournament-contact-phone-input').fill('123456789');
    await page
      .getByTestId('tournament-description-input')
      .fill(tournament.description);

    // Submit the form
    await page.getByTestId('tournament-save-button').click({ force: true });

    // Wait for redirect or success message
    await page.waitForTimeout(2000);

    // Should show success message or redirect to tournament management
    const currentPathAfterCreate = helpers.getCurrentPath();
    console.log(
      'Current path after creating tournament:',
      currentPathAfterCreate
    );

    // Should be redirected to the created tournament page
    expect(currentPathAfterCreate).toMatch(/\/fi\/tournaments\/\w+/);
  });

  test('should confirm new tournament appears in tournaments list', async ({
    page,
  }) => {
    const tournament = testData.tournaments.sampleTournament;

    // Sign in as team manager first
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // First create a tournament
    await helpers.navigateTo('/fi/tournaments');

    // Click the "Luo turnaus" (Create Tournament) link
    const createButton = page
      .getByTestId('create-tournament-button')
      .or(page.getByRole('link', { name: 'Luo turnaus' }));
    await createButton.click();

    // Wait for navigation to complete
    await page.waitForURL('**/tournaments/new');
    await page.waitForLoadState('networkidle');

    // Fill required fields using test IDs
    await page.getByTestId('tournament-name-input').fill(tournament.name);
    await page.getByTestId('tournament-season-input').fill('2025');
    await page
      .getByTestId('tournament-start-date-input')
      .fill(tournament.startDate);
    await page
      .getByTestId('tournament-end-date-input')
      .fill(tournament.endDate);
    // Country is auto-selected by the form, so we can skip this step
    await page.getByTestId('tournament-city-input').fill('Test City');
    await page.getByTestId('tournament-address-input').fill('Test Address');
    await page
      .getByTestId('tournament-contact-email-input')
      .fill('contact@test.com');
    await page.getByTestId('tournament-contact-phone-input').fill('123456789');
    await page
      .getByTestId('tournament-description-input')
      .fill(tournament.description);

    // Submit the form
    await page.getByTestId('tournament-save-button').click({ force: true });

    // Wait for redirect to tournament page
    await page.waitForURL('**/tournaments/*', { timeout: 10000 });
    await page.waitForTimeout(2000);

    // Navigate back to tournaments list to verify the tournament appears
    await helpers.navigateTo('/fi/tournaments');

    // Wait for tournaments to load
    await page.waitForTimeout(3000);

    // Should see the new tournament in the list
    await expect(page.locator('tbody tr').first()).toContainText(
      tournament.name
    );

    // Should show the tournament details
    await expect(page.locator('tbody tr').first()).toContainText('Test City');
    await expect(page.locator('tbody tr').first()).toContainText('2025');
  });

  test('should navigate to teams page', async ({ page }) => {
    // Navigate to teams page
    await helpers.navigateTo('/fi/teams');

    // Should be on teams page
    expect(helpers.getCurrentPath()).toContain('/teams');

    // Should show teams content
    await expect(
      page.getByRole('heading', { name: 'Joukkueet' })
    ).toBeVisible();
  });

  test('should navigate to venues page', async ({ page }) => {
    // Navigate to venues page
    await helpers.navigateTo('/fi/venues');

    // Should be on venues page
    expect(helpers.getCurrentPath()).toContain('/venues');

    // Should show venues content
    await expect(page.getByRole('heading', { name: 'Paikat' })).toBeVisible();
  });
});
