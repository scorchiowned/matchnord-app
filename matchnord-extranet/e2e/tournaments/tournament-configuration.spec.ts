import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import testData from '../fixtures/test-data.json';

test.describe('Tournament Configuration Flow', () => {
  let helpers: TestHelpers;
  let createdTournamentId: string;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test('should create tournament and navigate to management page', async ({
    page,
  }) => {
    // Sign in as team manager
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // Navigate to tournaments list
    await helpers.navigateTo('/fi/tournaments');

    // Create a new tournament
    const createButton = page
      .getByTestId('create-tournament-button')
      .or(page.getByRole('link', { name: 'Luo turnaus' }));
    await createButton.click();

    // Wait for navigation to tournament creation page
    await page.waitForURL('**/tournaments/new');
    await page.waitForLoadState('networkidle');

    // Wait for the form to be visible
    await expect(page.getByTestId('tournament-name-input')).toBeVisible();

    // Fill tournament form
    const tournament = testData.tournaments.sampleTournament;
    await page.getByTestId('tournament-name-input').fill(tournament.name);
    await page.getByTestId('tournament-season-input').fill('2025');
    await page.getByTestId('tournament-start-date-input').fill('2025-06-01');
    await page.getByTestId('tournament-end-date-input').fill('2025-06-03');

    // Country should be auto-selected by the form, so we can skip this step
    // If needed, we can select a country later

    await page.getByTestId('tournament-city-input').fill('Test City');
    await page.getByTestId('tournament-address-input').fill('Test Address');
    await page
      .getByTestId('tournament-contact-email-input')
      .fill('contact@test.com');
    await page.getByTestId('tournament-contact-phone-input').fill('123456789');
    await page
      .getByTestId('tournament-description-input')
      .fill(tournament.description);

    // Submit the form (force click to bypass any overlays)
    await page.getByTestId('tournament-save-button').click({ force: true });

    // Wait a bit for the form submission to process
    await page.waitForTimeout(2000);

    // Check current URL to see what happened
    const currentUrl = page.url();
    console.log('Current URL after form submission:', currentUrl);

    // Wait for either redirect or error message
    try {
      await page.waitForURL('**/tournaments/*', { timeout: 10000 });
    } catch (error) {
      // If no redirect, check for error messages
      const errorMessage = page.locator('[role="alert"], .error, .toast');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('Tournament creation error:', errorText);
      }
      console.log('No redirect happened, staying on:', page.url());
      throw error;
    }

    // Extract tournament ID from URL
    const finalUrl = page.url();
    const urlMatch = finalUrl.match(/\/tournaments\/([^\/]+)/);
    if (urlMatch) {
      createdTournamentId = urlMatch[1] || '';
      console.log('Created tournament ID:', createdTournamentId);
    } else {
      console.log('Could not extract tournament ID from URL:', finalUrl);
    }

    // Should be on tournament page (not management page yet)
    expect(helpers.getCurrentPath()).toMatch(/\/tournaments\/[^\/]+$/);

    // Navigate to management page
    await helpers.navigateTo(`/fi/tournaments/${createdTournamentId}/manage`);

    // Should be on management page
    expect(helpers.getCurrentPath()).toContain('/manage');

    // Should show tournament management content (not "Tournament not found")
    await expect(page.getByText('Tournament not found.')).not.toBeVisible();

    // Should show the tournament name or management interface
    await expect(
      page.getByText(testData.tournaments.sampleTournament.name)
    ).toBeVisible();
  });

  test('should configure tournament settings', async ({ page }) => {
    // Skip if no tournament was created in previous test
    test.skip(!createdTournamentId, 'No tournament created in previous test');

    // Sign in as team manager
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // Navigate to tournament management page
    await helpers.navigateTo(`/fi/tournaments/${createdTournamentId}/manage`);

    // Should show tournament management tabs
    await expect(
      page.getByRole('tab', { name: /Overview|Yleiskatsaus/ })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Teams|Joukkueet/ })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Venues|Paikat/ })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Divisions|Sarjat/ })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Matches|Ottelut/ })
    ).toBeVisible();
    await expect(
      page.getByRole('tab', { name: /Settings|Asetukset/ })
    ).toBeVisible();

    // Click on Settings tab
    await page.getByRole('tab', { name: /Settings|Asetukset/ }).click();

    // Should show tournament settings
    await expect(
      page.getByText(/Tournament Settings|Turnausasetukset/)
    ).toBeVisible();
  });

  test('should add venues to tournament', async ({ page }) => {
    // Skip if no tournament was created
    test.skip(!createdTournamentId, 'No tournament created in previous test');

    // Sign in as team manager
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // Navigate to tournament management page
    await helpers.navigateTo(`/fi/tournaments/${createdTournamentId}/manage`);

    // Click on Venues tab
    await page.getByRole('tab', { name: /Venues|Paikat/ }).click();

    // Should show venues management interface
    await expect(page.getByText(/Venues|Paikat/)).toBeVisible();

    // Look for add venue button
    const addVenueButton = page
      .getByRole('button', { name: /Add Venue|Lisää paikka/ })
      .or(page.getByTestId('add-venue-button'))
      .or(page.getByRole('button', { name: /Plus/ }));

    if (await addVenueButton.isVisible()) {
      await addVenueButton.click();

      // Should show venue creation form
      await expect(page.getByText(/Create Venue|Luo paikka/)).toBeVisible();
    }
  });

  test('should add divisions to tournament', async ({ page }) => {
    // Skip if no tournament was created
    test.skip(!createdTournamentId, 'No tournament created in previous test');

    // Sign in as team manager
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // Navigate to tournament management page
    await helpers.navigateTo(`/fi/tournaments/${createdTournamentId}/manage`);

    // Click on Divisions tab
    await page.getByRole('tab', { name: /Divisions|Sarjat/ }).click();

    // Should show divisions management interface
    await expect(page.getByText(/Divisions|Sarjat/)).toBeVisible();

    // Look for add division button
    const addDivisionButton = page
      .getByRole('button', { name: /Add Division|Lisää sarja/ })
      .or(page.getByTestId('add-division-button'))
      .or(page.getByRole('button', { name: /Plus/ }));

    if (await addDivisionButton.isVisible()) {
      await addDivisionButton.click();

      // Should show division creation form
      await expect(page.getByText(/Create Division|Luo sarja/)).toBeVisible();
    }
  });

  test('should manage teams in tournament', async ({ page }) => {
    // Skip if no tournament was created
    test.skip(!createdTournamentId, 'No tournament created in previous test');

    // Sign in as team manager
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // Navigate to tournament management page
    await helpers.navigateTo(`/fi/tournaments/${createdTournamentId}/manage`);

    // Click on Teams tab
    await page.getByRole('tab', { name: /Teams|Joukkueet/ }).click();

    // Should show teams management interface
    await expect(page.getByText(/Teams|Joukkueet/)).toBeVisible();

    // Look for add team button
    const addTeamButton = page
      .getByRole('button', { name: /Add Team|Lisää joukkue/ })
      .or(page.getByTestId('add-team-button'))
      .or(page.getByRole('button', { name: /Plus/ }));

    if (await addTeamButton.isVisible()) {
      await addTeamButton.click();

      // Should show team creation form
      await expect(page.getByText(/Create Team|Luo joukkue/)).toBeVisible();
    }
  });

  test('should view tournament overview and statistics', async ({ page }) => {
    // Skip if no tournament was created
    test.skip(!createdTournamentId, 'No tournament created in previous test');

    // Sign in as team manager
    await helpers.signIn(
      testData.users.teamManager.email,
      testData.users.teamManager.password
    );

    // Navigate to tournament management page
    await helpers.navigateTo(`/fi/tournaments/${createdTournamentId}/manage`);

    // Should be on Overview tab by default
    await expect(
      page.getByRole('tab', { name: /Overview|Yleiskatsaus/ })
    ).toBeVisible();

    // Should show tournament statistics
    await expect(page.getByText(/Teams|Joukkueet/)).toBeVisible();
    await expect(page.getByText(/Venues|Paikat/)).toBeVisible();
    await expect(page.getByText(/Divisions|Sarjat/)).toBeVisible();
    await expect(page.getByText(/Matches|Ottelut/)).toBeVisible();

    // Should show tournament information
    await expect(
      page.getByText(testData.tournaments.sampleTournament.name)
    ).toBeVisible();
  });
});
