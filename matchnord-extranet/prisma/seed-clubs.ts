import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env files (try multiple locations)
// Priority: .env.backup (production) > .env.local > .env
const envPaths = [
  path.join(process.cwd(), '.env.backup'), // Production credentials
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '..', '.env.local'),
  path.join(process.cwd(), '..', '.env'),
];

let loadedEnv = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
    console.log(`📂 Loaded environment from: ${envPath}`);
    loadedEnv = true;
    break;
  }
}

// Also try default dotenv behavior if nothing was loaded
if (!loadedEnv) {
  config();
}

// Check if DATABASE_URL is set, if not construct it from POSTGRES_PASSWORD
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_PASSWORD) {
    // Construct DATABASE_URL from POSTGRES_PASSWORD (like deploy scripts do)
    const password = encodeURIComponent(process.env.POSTGRES_PASSWORD);
    process.env.DATABASE_URL = `postgresql://matchnordadmin:${password}@matchnord-db.postgres.database.azure.com:5432/postgres?schema=public`;
    console.log('🔧 Constructed DATABASE_URL from POSTGRES_PASSWORD');
  } else {
    console.error(
      '❌ DATABASE_URL or POSTGRES_PASSWORD environment variable is not set!'
    );
    console.error('   Please set it in your .env file or export it:');
    console.error(
      '   export DATABASE_URL="postgresql://user:password@host:port/database"'
    );
    console.error('   OR');
    console.error('   export POSTGRES_PASSWORD="your-password"');
    process.exit(1);
  }
} else {
  // Validate and fix DATABASE_URL if password needs encoding
  const dbUrl = process.env.DATABASE_URL;
  // Check if URL is malformed (contains unencoded special characters in password)
  try {
    new URL(dbUrl);
  } catch (e) {
    // URL is malformed, try to fix it by encoding the password
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@(.+)/);
    if (match) {
      const [, user, password, rest] = match;
      const encodedPassword = encodeURIComponent(password);
      process.env.DATABASE_URL = `postgresql://${user}:${encodedPassword}@${rest}`;
      console.log('🔧 Fixed DATABASE_URL by encoding password');
    } else {
      console.error(
        '❌ DATABASE_URL is malformed and cannot be fixed automatically'
      );
      console.error('   Please check your .env file');
      process.exit(1);
    }
  }
}

const db = new PrismaClient();

interface ClubRow {
  name: string;
  image_url: string;
}

async function main() {
  console.log('🏢 Seeding clubs from CSV...');

  // Get or create Finland
  const finland = await db.country.upsert({
    where: { code: 'FI' },
    update: {},
    create: {
      name: 'Finland',
      code: 'FI',
      flag: '🇫🇮',
      phoneCode: '+358',
      currency: 'EUR',
      timezone: 'Europe/Helsinki',
    },
  });

  console.log(`📍 Using country: ${finland.name} (${finland.code})`);

  // Read CSV file - check multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'team_names_and_logos.csv'),
    path.join(process.cwd(), '..', 'team_names_and_logos.csv'),
    path.join(__dirname, '..', '..', 'team_names_and_logos.csv'),
  ];

  let csvPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      csvPath = possiblePath;
      break;
    }
  }

  if (!csvPath) {
    console.error(`❌ CSV file not found. Checked paths:`);
    possiblePaths.forEach((p) => console.error(`   - ${p}`));
    process.exit(1);
  }

  console.log(`📂 Reading CSV from: ${csvPath}`);

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim() !== '');

  // Skip header row
  const dataLines = lines.slice(1);

  console.log(`📄 Found ${dataLines.length} teams in CSV`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (line) => {
        try {
          // Parse CSV line - handle quoted values and empty fields
          // Format: name,image_url
          // Handle cases where name might contain commas (quoted) or image_url might be empty
          let name = '';
          let imageUrl = '';

          // Check if line starts with quote (quoted name)
          if (line.startsWith('"')) {
            // Find the closing quote
            const quoteEnd = line.indexOf('",');
            if (quoteEnd > 0) {
              name = line.substring(1, quoteEnd).trim();
              imageUrl = line.substring(quoteEnd + 2).trim();
            } else {
              // Try to find just the comma after quote
              const commaIndex = line.indexOf(',');
              if (commaIndex > 0) {
                name = line.substring(1, commaIndex - 1).trim();
                imageUrl = line.substring(commaIndex + 1).trim();
              }
            }
          } else {
            // Simple case: no quotes, just split by first comma
            const commaIndex = line.indexOf(',');
            if (commaIndex > 0) {
              name = line.substring(0, commaIndex).trim();
              imageUrl = line.substring(commaIndex + 1).trim();
            } else {
              // No comma found, entire line is the name
              name = line.trim();
            }
          }

          // Remove any remaining quotes
          name = name.replace(/^"|"$/g, '').trim();
          imageUrl = imageUrl.replace(/^"|"$/g, '').trim();

          if (!name || name === '') {
            skipped++;
            return;
          }

          // Check if club already exists
          const existing = await db.club.findUnique({
            where: { name },
          });

          if (existing) {
            // Update logo if provided and different
            if (imageUrl && imageUrl !== existing.logo) {
              await db.club.update({
                where: { name },
                data: { logo: imageUrl },
              });
              updated++;
            } else {
              skipped++; // Already exists with same data
            }
          } else {
            // Create new club
            await db.club.create({
              data: {
                name,
                logo: imageUrl || undefined,
                countryId: finland.id,
              },
            });
            created++;
          }
        } catch (error: any) {
          // Handle unique constraint errors gracefully
          if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            skipped++; // Duplicate name, skip it
          } else {
            console.error(
              `❌ Error processing line ${i + batch.indexOf(line) + 2}:`,
              error.message
            );
            errors++;
          }
        }
      })
    );

    // Progress indicator
    const processed = Math.min(i + batchSize, dataLines.length);
    console.log(`   Processed ${processed}/${dataLines.length} teams...`);
  }

  console.log('');
  console.log('✅ Club seeding completed!');
  console.log(`📊 Statistics:
    - Created: ${created}
    - Updated: ${updated}
    - Skipped: ${skipped}
    - Errors: ${errors}
    - Total processed: ${created + updated + skipped + errors}`);

  // Show some sample clubs
  const sampleClubs = await db.club.findMany({
    take: 10,
    where: {
      logo: { not: null },
    },
    orderBy: { name: 'asc' },
  });

  if (sampleClubs.length > 0) {
    console.log('');
    console.log('📋 Sample clubs with logos:');
    sampleClubs.forEach((club) => {
      console.log(`   - ${club.name}${club.logo ? ' ✓' : ''}`);
    });
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
