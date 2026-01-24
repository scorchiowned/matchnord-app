const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env.local');
let content = fs.readFileSync(envFile, 'utf8');

// Check if DATABASE_URL exists and fix it
const dbUrlMatch = content.match(/^DATABASE_URL=(.+)$/m);
if (dbUrlMatch) {
  let dbUrl = dbUrlMatch[1].trim().replace(/^["']|["']$/g, ''); // Remove quotes
  
  // Check if it's a valid URL
  try {
    new URL(dbUrl);
    console.log('✅ DATABASE_URL is already a valid URL');
  } catch (e) {
    console.log('❌ DATABASE_URL is invalid:', e.message);
    console.log('Current value:', dbUrl.substring(0, 50) + '...');
    console.log('\nPlease ensure DATABASE_URL is a valid PostgreSQL URL.');
    console.log('Example: postgresql://user:password@host:port/database');
    console.log('Note: Special characters in password must be URL-encoded (e.g., ! becomes %21)');
    process.exit(1);
  }
} else {
  console.log('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}
