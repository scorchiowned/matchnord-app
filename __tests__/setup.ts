import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/tournament_app_test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
