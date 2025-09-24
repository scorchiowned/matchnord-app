import { chromium, FullConfig } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import testData from '../fixtures/test-data.json';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const helpers = new TestHelpers(page);

  try {
    // Set up test data in the database
    console.log('Setting up test data...');

    // You can add database seeding logic here
    // For example, creating test users, tournaments, etc.

    // Test data setup - using existing seed data
    console.log('Using existing seed data for tests');

    console.log('Test data setup completed');
  } catch (error) {
    console.error('Failed to set up test data:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
