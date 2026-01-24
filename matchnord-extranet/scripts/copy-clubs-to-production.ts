import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Construct Azure Storage URL
function constructAzureUrl(
  accountName: string,
  container: string,
  blobName: string
): string {
  return `https://${accountName}.blob.core.windows.net/${container}/${blobName}`;
}

// Get filename from URL
function getFilenameFromUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const urlPath = url.pathname;
    return path.basename(urlPath);
  } catch {
    return 'logo.png';
  }
}

async function main() {
  console.log('🔄 Copying clubs from local to production database...\n');

  // Azure Storage configuration
  const azureAccountName =
    process.env.AZURE_STORAGE_ACCOUNT_NAME || 'matchnordstorage';
  const container = 'clubs';

  // Load local database URL
  const localEnvPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(localEnvPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  // Clear process.env and load local
  delete process.env.DATABASE_URL;
  config({ path: localEnvPath });
  const localDbUrl = process.env.DATABASE_URL;

  if (!localDbUrl || !localDbUrl.startsWith('postgresql://')) {
    console.error('❌ DATABASE_URL not found or invalid in .env.local');
    process.exit(1);
  }

  // Load production database URL
  const prodEnvPath = path.join(process.cwd(), '.env.backup');
  if (!fs.existsSync(prodEnvPath)) {
    console.error('❌ .env.backup not found');
    process.exit(1);
  }

  // Clear and load production env
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_PASSWORD;
  config({ path: prodEnvPath });

  let prodDbUrl = process.env.DATABASE_URL;
  if (!prodDbUrl && process.env.POSTGRES_PASSWORD) {
    const password = encodeURIComponent(process.env.POSTGRES_PASSWORD);
    prodDbUrl = `postgresql://matchnordadmin:${password}@matchnord-db.postgres.database.azure.com:5432/postgres?schema=public`;
  }

  if (!prodDbUrl || !prodDbUrl.startsWith('postgresql://')) {
    console.error(
      '❌ DATABASE_URL or POSTGRES_PASSWORD not found or invalid in .env.backup'
    );
    process.exit(1);
  }

  // Create database clients
  const localDb = new PrismaClient({
    datasources: {
      db: {
        url: localDbUrl,
      },
    },
  });

  const prodDb = new PrismaClient({
    datasources: {
      db: {
        url: prodDbUrl,
      },
    },
  });

  try {
    // Get Finland from both databases
    console.log('📍 Finding Finland country...');
    const localFinland = await localDb.country.findFirst({
      where: { code: 'FI' },
    });
    const prodFinland = await prodDb.country.findFirst({
      where: { code: 'FI' },
    });

    if (!localFinland) {
      console.error('❌ Finland not found in local database');
      process.exit(1);
    }

    if (!prodFinland) {
      console.log('   Creating Finland in production...');
      await prodDb.country.create({
        data: {
          name: 'Finland',
          code: 'FI',
          flag: '🇫🇮',
          phoneCode: '+358',
          currency: 'EUR',
          timezone: 'Europe/Helsinki',
        },
      });
      console.log('   ✅ Finland created');
    }

    const finlandId =
      prodFinland?.id ||
      (await prodDb.country.findFirst({ where: { code: 'FI' } }))!.id;

    // Empty production clubs table
    console.log('\n🗑️  Emptying production clubs table...');
    const deleteCount = await prodDb.club.deleteMany({});
    console.log(`   ✅ Deleted ${deleteCount.count} clubs from production`);

    // Get all clubs from local database
    console.log('\n📥 Fetching clubs from local database...');
    const localClubs = await localDb.club.findMany({
      orderBy: { name: 'asc' },
    });

    console.log(`   Found ${localClubs.length} clubs in local database\n`);

    // Process clubs
    let created = 0;
    let errors = 0;

    for (let i = 0; i < localClubs.length; i++) {
      const localClub = localClubs[i];
      if (!localClub) continue;

      try {
        // Create new club
        const newClub = await prodDb.club.create({
          data: {
            name: localClub.name,
            shortName: localClub.shortName,
            city: localClub.city,
            countryId: finlandId,
            website: localClub.website,
            description: localClub.description,
            foundedYear: localClub.foundedYear,
          },
        });

        // Update with Azure Storage logo URL if local club has a logo
        if (localClub.logo) {
          const filename = getFilenameFromUrl(localClub.logo);
          const blobName = `${newClub.id}/${filename}`;
          const azureLogoUrl = constructAzureUrl(
            azureAccountName,
            container,
            blobName
          );

          await prodDb.club.update({
            where: { id: newClub.id },
            data: { logo: azureLogoUrl },
          });
        }

        created++;
        if ((i + 1) % 100 === 0) {
          console.log(`   Processed ${i + 1}/${localClubs.length}...`);
        }
      } catch (error: any) {
        errors++;
        console.error(
          `   ❌ Error processing ${localClub.name}:`,
          error.message
        );
      }
    }

    console.log('\n✅ Copy completed!');
    console.log(`📊 Statistics:
    - Created: ${created}
    - Errors: ${errors}
    - Total: ${localClubs.length}`);

    // Show sample clubs
    const sampleClubs = await prodDb.club.findMany({
      take: 10,
      where: {
        logo: { not: null },
      },
      orderBy: { name: 'asc' },
    });

    if (sampleClubs.length > 0) {
      console.log('\n📋 Sample clubs in production:');
      sampleClubs.forEach((club) => {
        const logoType = club.logo?.includes('blob.core.windows.net')
          ? 'Azure Storage'
          : club.logo?.includes('cdn.torneopal.net')
            ? 'CDN'
            : 'Other';
        console.log(`   - ${club.name} (${logoType}${club.logo ? ' ✓' : ''})`);
      });
    }
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await localDb.$disconnect();
    await prodDb.$disconnect();
  }
}

main();
