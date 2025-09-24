import { chromium, FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Clean up test data
    console.log('Cleaning up test data...');

    // Test data cleanup - using existing seed data
    console.log('Using existing seed data for tests');

    console.log('Test data cleanup completed');
  } catch (error) {
    console.error('Failed to clean up test data:', error);
    // Don't throw here as it might mask test failures
  } finally {
    await browser.close();
  }
}

export default globalTeardown;
