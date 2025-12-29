import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { BlobServiceClient } from '@azure/storage-blob';

// Load environment variables - prioritize .env.local for local development
const envPaths = [
  path.join(process.cwd(), '.env.local'), // Local development
  path.join(process.cwd(), '.env'),
];

let loadedEnv = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    config({ path: envPath });
    loadedEnv = true;
    break;
  }
}

if (!loadedEnv) {
  config(); // Fallback to default dotenv behavior
}

const db = new PrismaClient();

// Get filename from URL
function getFilenameFromUrl(imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const urlPath = url.pathname;
    return path.basename(urlPath);
  } catch {
    // Fallback if URL parsing fails
    return 'logo.png';
  }
}

// Construct Azure blob URL
function constructAzureUrl(
  accountName: string,
  container: string,
  blobName: string
): string {
  return `https://${accountName}.blob.core.windows.net/${container}/${blobName}`;
}

async function seedClubsFromCSV() {
  console.log('\n🏢 Seeding clubs from CSV with Azure Storage logos...');

  // Get Finland (should already exist from earlier seeding)
  const finland = await db.country.findFirst({
    where: { code: 'FI' },
  });

  if (!finland) {
    console.log('   ⚠️  Finland not found, skipping club seeding');
    return;
  }

  console.log(`📍 Using country: ${finland.name} (${finland.code})`);

  // Check for Azure Storage credentials (for local development)
  const azureAccountName =
    process.env.AZURE_STORAGE_ACCOUNT_NAME || 'matchnordstorage';
  const azureAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const container = 'clubs';

  if (!azureAccountKey) {
    console.log(
      '   ⚠️  AZURE_STORAGE_ACCOUNT_KEY not found. Skipping club seeding.'
    );
    console.log('      Set AZURE_STORAGE_ACCOUNT_KEY in .env.local to enable club seeding.');
    return;
  }

  // Read CSV file - check multiple possible locations
  const possiblePaths = [
    path.join(process.cwd(), 'team_names_and_logos.csv'),
    path.join(process.cwd(), '..', 'team_names_and_logos.csv'),
    path.join(__dirname, '..', 'team_names_and_logos.csv'),
  ];

  let csvPath: string | null = null;
  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      csvPath = possiblePath;
      break;
    }
  }

  if (!csvPath) {
    console.log(`   ⚠️  CSV file not found. Skipping club seeding. Checked paths:`);
    possiblePaths.forEach((p) => console.log(`      - ${p}`));
    return;
  }

  console.log(`📂 Reading CSV from: ${csvPath}`);
  console.log(`📦 Azure Storage: ${azureAccountName}/${container}`);

  // Scan Azure Storage to get all club IDs and their filenames
  console.log('📦 Scanning Azure Storage for club logos...');
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${azureAccountName};AccountKey=${azureAccountKey};EndpointSuffix=core.windows.net`;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(container);

  // Map: filename (lowercase) -> { clubId, filename }
  const azureClubsByFilename = new Map<
    string,
    { clubId: string; filename: string }
  >();

  let blobCount = 0;
  try {
    for await (const blob of containerClient.listBlobsFlat()) {
      blobCount++;
      // Blob names: {clubId}/{filename}
      const parts = blob.name.split('/');
      if (parts.length === 2) {
        const clubId = parts[0];
        const filename = parts[1];
        if (clubId && filename) {
          // Store by filename (case-insensitive for matching)
          const key = filename.toLowerCase();
          if (!azureClubsByFilename.has(key)) {
            azureClubsByFilename.set(key, { clubId, filename });
          }
        }
      }
    }
    console.log(`   Scanned ${blobCount} blobs`);
    console.log(
      `   Found ${azureClubsByFilename.size} unique club IDs in Azure Storage\n`
    );
  } catch (error: any) {
    console.error(`   ❌ Error scanning Azure Storage: ${error.message}`);
    console.log('   ⚠️  Skipping club seeding due to Azure Storage error.');
    return;
  }

  // Parse CSV file
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter((line) => line.trim() !== '');

  // Skip header row (first line is empty, second is header)
  const dataLines = lines.slice(2);

  console.log(`📄 Found ${dataLines.length} teams in CSV\n`);

  let created = 0;
  let matched = 0;
  let notMatched = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches to avoid overwhelming the database
  const batchSize = 50;
  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (line) => {
        try {
          // Parse CSV line - format: name,image_url
          // Find the last comma which separates name from URL
          const lastCommaIndex = line.lastIndexOf(',');

          if (lastCommaIndex === -1) {
            skipped++;
            return;
          }

          let name = line.substring(0, lastCommaIndex).trim();
          const csvImageUrl = line.substring(lastCommaIndex + 1).trim();

          // Remove quotes if present
          name = name.replace(/^"|"$/g, '').trim();

          if (!name || name === '') {
            skipped++;
            return;
          }

          // Extract filename from CSV URL for matching
          const filename = getFilenameFromUrl(csvImageUrl);
          const filenameKey = filename.toLowerCase();

          // Find matching club ID in Azure Storage by filename
          const azureClub = azureClubsByFilename.get(filenameKey);

          // Check if club already exists by name
          const existing = await db.club.findUnique({
            where: { name },
          });

          if (existing) {
            // Update with Azure Storage logo if matched
            if (azureClub) {
              const azureLogoUrl = constructAzureUrl(
                azureAccountName,
                container,
                `${azureClub.clubId}/${azureClub.filename}`
              );
              if (existing.logo !== azureLogoUrl) {
                await db.club.update({
                  where: { name },
                  data: { logo: azureLogoUrl },
                });
                matched++;
              } else {
                skipped++;
              }
            } else {
              skipped++; // Already exists, no Azure match
            }
          } else {
            // Create new club
            if (azureClub) {
              // Use Azure Storage club ID and URL
              const azureLogoUrl = constructAzureUrl(
                azureAccountName,
                container,
                `${azureClub.clubId}/${azureClub.filename}`
              );

              // Create club with the specific ID from Azure Storage using raw SQL
              await db.$executeRawUnsafe(
                `INSERT INTO "Club" (id, name, "countryId", logo, "createdAt", "updatedAt") 
                 VALUES ($1, $2, $3, $4, NOW(), NOW()) 
                 ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo, "updatedAt" = NOW()`,
                azureClub.clubId,
                name,
                finland.id,
                azureLogoUrl
              );
              matched++;
              created++;
            } else {
              // No matching logo in Azure Storage - create with new ID
              await db.club.create({
                data: {
                  name,
                  countryId: finland.id,
                  // No logo if not found in Azure Storage
                },
              });
              notMatched++;
              created++;
            }
          }
        } catch (error: any) {
          // Handle unique constraint errors gracefully
          if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
            skipped++; // Duplicate name, skip it
          } else {
            console.error(
              `   ❌ Error processing line ${i + batch.indexOf(line) + 3}:`,
              error.message
            );
            errors++;
          }
        }
      })
    );

    // Progress indicator
    const processed = Math.min(i + batchSize, dataLines.length);
    if (processed % 500 === 0 || processed === dataLines.length) {
      console.log(`   Processed ${processed}/${dataLines.length} teams...`);
    }
  }

  console.log(`\n✅ Club seeding completed!`);
  console.log(`   - Created: ${created} (${matched} with Azure match, ${notMatched} without)`);
  console.log(`   - Skipped: ${skipped}`);
  console.log(`   - Errors: ${errors}`);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Drop role column from TournamentAssignment if it exists (legacy column)
  await db.$executeRawUnsafe(`
    DO $$ 
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'TournamentAssignment' AND column_name = 'role'
      ) THEN
        ALTER TABLE "TournamentAssignment" DROP COLUMN "role";
      END IF;
    END $$;
  `);

  // Create countries
  const countries = await Promise.all([
    db.country.upsert({
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
    }),
    db.country.upsert({
      where: { code: 'SE' },
      update: {},
      create: {
        name: 'Sweden',
        code: 'SE',
        flag: '🇸🇪',
        phoneCode: '+46',
        currency: 'SEK',
        timezone: 'Europe/Stockholm',
      },
    }),
    db.country.upsert({
      where: { code: 'NO' },
      update: {},
      create: {
        name: 'Norway',
        code: 'NO',
        flag: '🇳🇴',
        phoneCode: '+47',
        currency: 'NOK',
        timezone: 'Europe/Oslo',
      },
    }),
    db.country.upsert({
      where: { code: 'DK' },
      update: {},
      create: {
        name: 'Denmark',
        code: 'DK',
        flag: '🇩🇰',
        phoneCode: '+45',
        currency: 'DKK',
        timezone: 'Europe/Copenhagen',
      },
    }),
    db.country.upsert({
      where: { code: 'EE' },
      update: {},
      create: {
        name: 'Estonia',
        code: 'EE',
        flag: '🇪🇪',
        phoneCode: '+372',
        currency: 'EUR',
        timezone: 'Europe/Tallinn',
      },
    }),
  ]);

  console.log(`🌍 Created ${countries.length} countries`);

  // Get Finland as default country
  const finland = countries.find((c) => c.code === 'FI')!;

  // Hash password for test users (using "password" as the test password)
  const testPassword = await bcrypt.hash('password', 10);

  // Create test users with different roles
  const adminUser = await db.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
      password: testPassword,
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      name: 'Test Admin',
      email: 'admin@test.com',
      role: 'ADMIN',
      password: testPassword,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const teamManagerUser = await db.user.upsert({
    where: { email: 'manager@test.com' },
    update: {
      password: testPassword,
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      name: 'Team Manager',
      email: 'manager@test.com',
      role: 'USER',
      password: testPassword,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const tournamentAdminUser = await db.user.upsert({
    where: { email: 'tournament@test.com' },
    update: {
      password: testPassword,
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      name: 'Tournament Admin',
      email: 'tournament@test.com',
      role: 'USER',
      password: testPassword,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  const refereeUser = await db.user.upsert({
    where: { email: 'referee@test.com' },
    update: {
      password: testPassword,
      isActive: true,
      emailVerified: new Date(),
    },
    create: {
      name: 'Test Referee',
      email: 'referee@test.com',
      role: 'USER',
      password: testPassword,
      isActive: true,
      emailVerified: new Date(),
    },
  });

  console.log(`👤 Created test users:
    - Admin: ${adminUser.email} (${adminUser.role})
    - Team Manager: ${teamManagerUser.email} (${teamManagerUser.role})
    - Tournament Admin: ${tournamentAdminUser.email} (${tournamentAdminUser.role})
    - Referee: ${refereeUser.email} (${refereeUser.role})`);

  // Create production users (idempotent - will only create if they don't exist)
  const productionAdmin = await db.user.upsert({
    where: { email: 'markus.anttila@hotmail.com' },
    update: {
      // Only update role if user exists but has wrong role
      role: 'ADMIN',
    },
    create: {
      name: 'Markus Anttila',
      email: 'markus.anttila@hotmail.com',
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(), // Pre-verified for production admin
    },
  });

  const productionUser = await db.user.upsert({
    where: { email: 'susanna.saarikko@gmail.com' },
    update: {
      // Only update role if user exists but has wrong role
      role: 'USER',
    },
    create: {
      name: 'Susanna Saarikko',
      email: 'susanna.saarikko@gmail.com',
      role: 'USER',
      isActive: true,
      emailVerified: new Date(), // Pre-verified for production user
    },
  });

  console.log(`👤 Production users:
    - ${productionAdmin.name}: ${productionAdmin.email} (${productionAdmin.role})
    - ${productionUser.name}: ${productionUser.email} (${productionUser.role})`);

  // Create organizations
  const org = await db.organization.upsert({
    where: { slug: 'finnish-football-federation' },
    update: {},
    create: {
      name: 'Finnish Football Federation',
      slug: 'finnish-football-federation',
      countryId: finland.id,
    },
  });

  // Create multiple tournaments
  const tournaments = await Promise.all([
    db.tournament.upsert({
      where: { slug: 'youth-championship-2024' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: adminUser.id,
        name: 'Youth Championship 2024',
        slug: 'youth-championship-2024',
        season: '2024',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        countryId: finland.id,
        city: 'Helsinki',
        description: 'Annual youth football championship for all age groups',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-01-15'),
        contactEmail: 'info@youthchampionship.fi',
        contactPhone: '+358 9 123 4567',
      },
    }),
    db.tournament.upsert({
      where: { slug: 'summer-cup-2024' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: adminUser.id,
        name: 'Summer Cup 2024',
        slug: 'summer-cup-2024',
        season: '2024',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-28'),
        countryId: finland.id,
        city: 'Tampere',
        description: 'Intensive summer tournament for competitive teams',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-02-01'),
        contactEmail: 'summer@cup.fi',
        contactPhone: '+358 3 987 6543',
      },
    }),
    db.tournament.upsert({
      where: { slug: 'autumn-league-2024' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: adminUser.id,
        name: 'Autumn League 2024',
        slug: 'autumn-league-2024',
        season: '2024',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-11-30'),
        countryId: finland.id,
        city: 'Espoo',
        description: 'Long-term league format tournament',
        status: 'DRAFT',
        contactEmail: 'autumn@league.fi',
        contactPhone: '+358 9 555 1234',
      },
    }),
    // Tournaments created by Team Manager
    db.tournament.upsert({
      where: { slug: 'manager-cup-2024' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: teamManagerUser.id,
        name: 'Manager Cup 2024',
        slug: 'manager-cup-2024',
        season: '2024',
        startDate: new Date('2024-08-15'),
        endDate: new Date('2024-08-18'),
        countryId: finland.id,
        city: 'Espoo',
        description: 'Tournament organized by team manager for local clubs',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-03-01'),
        contactEmail: 'manager@test.com',
        contactPhone: '+358 9 999 9999',
      },
    }),
    db.tournament.upsert({
      where: { slug: 'local-championship-2024' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: teamManagerUser.id,
        name: 'Local Championship 2024',
        slug: 'local-championship-2024',
        season: '2024',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-09-30'),
        countryId: finland.id,
        city: 'Vantaa',
        description: 'Local championship for regional teams',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-04-01'),
        contactEmail: 'manager@test.com',
        contactPhone: '+358 9 888 8888',
      },
    }),
    // Additional tournaments
    db.tournament.upsert({
      where: { slug: 'winter-cup-2024' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: adminUser.id,
        name: 'Winter Cup 2024',
        slug: 'winter-cup-2024',
        season: '2024',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-22'),
        countryId: finland.id,
        city: 'Rovaniemi',
        description: 'Indoor winter tournament in Lapland',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-10-01'),
        contactEmail: 'winter@cup.fi',
        contactPhone: '+358 16 123 4567',
      },
    }),
    db.tournament.upsert({
      where: { slug: 'spring-league-2025' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: tournamentAdminUser.id,
        name: 'Spring League 2025',
        slug: 'spring-league-2025',
        season: '2025',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-05-31'),
        countryId: finland.id,
        city: 'Turku',
        description: 'Spring league for competitive youth teams',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-12-01'),
        contactEmail: 'spring@league.fi',
        contactPhone: '+358 2 987 6543',
      },
    }),
    db.tournament.upsert({
      where: { slug: 'european-youth-cup-2025' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: adminUser.id,
        name: 'European Youth Cup 2025',
        slug: 'european-youth-cup-2025',
        season: '2025',
        startDate: new Date('2025-07-10'),
        endDate: new Date('2025-07-20'),
        countryId: finland.id,
        city: 'Helsinki',
        description:
          'International youth tournament with teams from Nordic countries',
        status: 'PUBLISHED',
        publishedAt: new Date('2025-01-15'),
        contactEmail: 'european@youth.fi',
        contactPhone: '+358 9 555 9999',
        maxTeams: 32,
        registrationDeadline: new Date('2025-05-01'),
      },
    }),
    db.tournament.upsert({
      where: { slug: 'recreational-cup-2024' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: teamManagerUser.id,
        name: 'Recreational Cup 2024',
        slug: 'recreational-cup-2024',
        season: '2024',
        startDate: new Date('2024-10-15'),
        endDate: new Date('2024-10-20'),
        countryId: finland.id,
        city: 'Jyväskylä',
        description: 'Fun tournament for recreational players',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-08-01'),
        contactEmail: 'recreational@cup.fi',
        contactPhone: '+358 14 777 8888',
        autoAcceptTeams: true,
      },
    }),
    db.tournament.upsert({
      where: { slug: 'elite-championship-2025' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: adminUser.id,
        name: 'Elite Championship 2025',
        slug: 'elite-championship-2025',
        season: '2025',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2025-08-15'),
        countryId: finland.id,
        city: 'Tampere',
        description: 'Elite level tournament for top youth teams',
        status: 'DRAFT',
        contactEmail: 'elite@championship.fi',
        contactPhone: '+358 3 444 5555',
        maxTeams: 16,
        registrationDeadline: new Date('2025-06-01'),
      },
    }),
    // FC Kasiysi Syysturnaus - New tournament
    db.tournament.upsert({
      where: { slug: 'fc-kasiysi-syysturnaus-2024' },
      update: {},
      create: {
        organizationId: org.id,
        createdById: adminUser.id,
        name: 'FC Kasiysi Syysturnaus',
        slug: 'fc-kasiysi-syysturnaus-2024',
        season: '2024',
        startDate: new Date('2024-09-15'),
        endDate: new Date('2024-09-22'),
        countryId: finland.id,
        city: 'Helsinki',
        description:
          'Autumn tournament featuring elite and competitive Finnish teams',
        status: 'PUBLISHED',
        publishedAt: new Date('2024-08-01'),
        contactEmail: 'info@fckasiysi.fi',
        contactPhone: '+358 9 123 4567',
        maxTeams: 16,
        registrationDeadline: new Date('2024-09-01'),
        teamsPublished: true,
        schedulePublished: true,
      },
    }),
  ]);

  const tournament = tournaments[0]!; // Use first tournament for main data
  const fcKasiysiTournament = tournaments[tournaments.length - 1]!; // Get the FC Kasiysi tournament

  // Create venues with new fields
  const venues = await Promise.all([
    db.venue.create({
      data: {
        tournamentId: tournament.id,
        name: 'Helsinki Olympic Stadium',
        streetName: 'Paavo Nurmen tie 1',
        postalCode: '00250',
        city: 'Helsinki',
        countryId: finland.id,
        capacity: 5000,
        description: 'Historic Olympic stadium with modern facilities',
        facilities: 'Changing rooms, medical room, parking',
        xCoordinate: 24.9263,
        yCoordinate: 60.1921,
      },
    }),
    db.venue.create({
      data: {
        tournamentId: tournament.id,
        name: 'Espoo Sports Complex',
        streetName: 'Urheilupuistontie 3',
        postalCode: '02100',
        city: 'Espoo',
        countryId: finland.id,
        capacity: 2000,
        description: 'Modern sports complex with multiple fields',
        facilities: 'Indoor facilities, cafe, parking',
        xCoordinate: 24.6569,
        yCoordinate: 60.2055,
      },
    }),
    db.venue.create({
      data: {
        tournamentId: tournament.id,
        name: 'Vantaa Training Center',
        streetName: 'Urheilukatu 15',
        postalCode: '01300',
        city: 'Vantaa',
        countryId: finland.id,
        capacity: 1000,
        description: 'Professional training facility',
        facilities: 'Training equipment, analysis room',
        xCoordinate: 25.0406,
        yCoordinate: 60.2941,
      },
    }),
    db.venue.create({
      data: {
        tournamentId: tournament.id,
        name: 'Tampere Arena',
        streetName: 'Ratinan rantatie 1',
        postalCode: '33100',
        city: 'Tampere',
        countryId: finland.id,
        capacity: 3000,
        description: 'Multi-purpose arena in Tampere',
        facilities: 'VIP areas, media center, parking',
        xCoordinate: 23.7871,
        yCoordinate: 61.4991,
      },
    }),
  ]);

  // Create divisions with birth years
  const divisions = await Promise.all([
    db.division.create({
      data: {
        tournamentId: tournament.id,
        name: 'U18 Division',
        birthYear: 2006,
        format: '11v11',
        level: 'COMPETITIVE',
        minTeams: 4,
        maxTeams: 16,
      },
    }),
    db.division.create({
      data: {
        tournamentId: tournament.id,
        name: 'U16 Division',
        birthYear: 2008,
        format: '11v11',
        level: 'COMPETITIVE',
        minTeams: 4,
        maxTeams: 16,
      },
    }),
    db.division.create({
      data: {
        tournamentId: tournament.id,
        name: 'U14 Division',
        birthYear: 2010,
        format: '9v9',
        level: 'CHALLENGE',
        minTeams: 4,
        maxTeams: 12,
      },
    }),
    db.division.create({
      data: {
        tournamentId: tournament.id,
        name: 'U12 Division',
        birthYear: 2012,
        format: '7v7',
        level: 'RECREATIONAL',
        minTeams: 4,
        maxTeams: 8,
      },
    }),
  ]);

  // Create groups for each division
  const groups = [];
  for (let i = 0; i < divisions.length; i++) {
    const division = divisions[i];
    if (!division) continue;

    const divisionGroups = await Promise.all([
      db.group.create({
        data: {
          divisionId: division.id,
          name: 'Group A',
        },
      }),
      db.group.create({
        data: {
          divisionId: division.id,
          name: 'Group B',
        },
      }),
      db.group.create({
        data: {
          divisionId: division.id,
          name: 'Group C',
        },
      }),
    ]);
    groups.push(...divisionGroups);
  }

  // Create teams for each division
  const teams = [];
  const teamNames = [
    'Helsinki FC',
    'Espoo United',
    'Tampere Tigers',
    'Turku Wolves',
    'Oulu Eagles',
    'Jyväskylä Lions',
    'Vantaa Vikings',
    'Lahti Warriors',
    'Kuopio Knights',
    'Pori Panthers',
    'Lappeenranta Lions',
    'Seinäjoki Stars',
    // Additional teams
    'Hämeenlinna Hawks',
    'Kotka Seagulls',
    'Mikkeli Bears',
    'Joensuu Wolves',
    'Rovaniemi Reindeers',
    'Kemi Kings',
    'Tornio Thunder',
    'Kokkola Crusaders',
    'Vaasa Vikings',
    'Pietarsaari Pirates',
    'Kajaani Knights',
    'Iisalmi Eagles',
    'Kuusamo Bears',
    'Kemi-Tornio United',
    'Raahe Rovers',
    'Ylivieska Youth',
    'Nivala Ninjas',
    'Haapavesi Heroes',
    'Siilinjärvi Stars',
    'Lapua Lions',
    'Alavus Aces',
    'Ähtäri Arrows',
    'Keuruu Kings',
    'Jämsä Jets',
    'Mänttä Mavericks',
    'Vilppula Vipers',
    'Orivesi Owls',
    'Kangasala Knights',
    'Pirkkala Panthers',
    'Nokia Ninjas',
    'Ylöjärvi Youth',
    'Ikaalinen Icons',
    'Parkano Pirates',
    'Kihniö Kings',
    'Jämijärvi Jets',
    'Kankaanpää Knights',
    'Honkajoki Hawks',
    'Karvia Kings',
    'Siikainen Stars',
    'Merikarvia Mavericks',
    'Pomarkku Panthers',
    'Lavia Lions',
    'Köyliö Kings',
    'Eura Eagles',
    'Eurajoki Jets',
    'Rauma Rovers',
    'Lappi Lions',
    'Pyhäranta Panthers',
    'Kokemäki Kings',
    'Harjavalta Hawks',
    'Nakkila Ninjas',
    'Ulvila United',
    'Noormarkku Knights',
    'Kihniö Kings',
    'Jämijärvi Jets',
    'Kankaanpää Knights',
    'Honkajoki Hawks',
    'Karvia Kings',
    'Siikainen Stars',
    'Merikarvia Mavericks',
    'Pomarkku Panthers',
    'Lavia Lions',
    'Köyliö Kings',
    'Eura Eagles',
    'Eurajoki Jets',
    'Rauma Rovers',
    'Lappi Lions',
    'Pyhäranta Panthers',
    'Kokemäki Kings',
    'Harjavalta Hawks',
    'Nakkila Ninjas',
    'Ulvila United',
    'Noormarkku Knights',
  ];

  for (let i = 0; i < divisions.length; i++) {
    const division = divisions[i];
    if (!division) continue;

    // Create 6 teams per division instead of 3
    const divisionTeams = await Promise.all([
      db.team.create({
        data: {
          tournamentId: tournament.id,
          countryId: finland.id,
          name: `${teamNames[i * 6] || `Team ${i * 6 + 1}`}`,
          shortName: `${
            teamNames[i * 6]
              ?.split(' ')
              .map((w) => w[0])
              .join('') || `T${i * 6 + 1}`
          }`,
        },
      }),
      db.team.create({
        data: {
          tournamentId: tournament.id,
          countryId: finland.id,
          name: `${teamNames[i * 6 + 1] || `Team ${i * 6 + 2}`}`,
          shortName: `${
            teamNames[i * 6 + 1]
              ?.split(' ')
              .map((w) => w[0])
              .join('') || `T${i * 6 + 2}`
          }`,
        },
      }),
      db.team.create({
        data: {
          tournamentId: tournament.id,
          countryId: finland.id,
          name: `${teamNames[i * 6 + 2] || `Team ${i * 6 + 3}`}`,
          shortName: `${
            teamNames[i * 6 + 2]
              ?.split(' ')
              .map((w) => w[0])
              .join('') || `T${i * 6 + 3}`
          }`,
        },
      }),
      db.team.create({
        data: {
          tournamentId: tournament.id,
          countryId: finland.id,
          name: `${teamNames[i * 6 + 3] || `Team ${i * 6 + 4}`}`,
          shortName: `${
            teamNames[i * 6 + 3]
              ?.split(' ')
              .map((w) => w[0])
              .join('') || `T${i * 6 + 4}`
          }`,
        },
      }),
      db.team.create({
        data: {
          tournamentId: tournament.id,
          countryId: finland.id,
          name: `${teamNames[i * 6 + 4] || `Team ${i * 6 + 5}`}`,
          shortName: `${
            teamNames[i * 6 + 4]
              ?.split(' ')
              .map((w) => w[0])
              .join('') || `T${i * 6 + 5}`
          }`,
        },
      }),
      db.team.create({
        data: {
          tournamentId: tournament.id,
          countryId: finland.id,
          name: `${teamNames[i * 6 + 5] || `Team ${i * 6 + 6}`}`,
          shortName: `${
            teamNames[i * 6 + 5]
              ?.split(' ')
              .map((w) => w[0])
              .join('') || `T${i * 6 + 6}`
          }`,
        },
      }),
    ]);
    teams.push(...divisionTeams);
  }

  // Assign teams to groups (2 teams per group for first division)
  await db.group.update({
    where: { id: groups[0]!.id },
    data: {
      teams: {
        connect: [{ id: teams[0]!.id }, { id: teams[1]!.id }],
      },
    },
  });

  await db.group.update({
    where: { id: groups[1]!.id },
    data: {
      teams: {
        connect: [{ id: teams[2]!.id }, { id: teams[3]!.id }],
      },
    },
  });

  await db.group.update({
    where: { id: groups[2]!.id },
    data: {
      teams: {
        connect: [{ id: teams[4]!.id }, { id: teams[5]!.id }],
      },
    },
  });

  // Create players for each team with appropriate birth dates
  const players = [];
  const firstNames = [
    'Mikael',
    'Jukka',
    'Aleksi',
    'Eero',
    'Lauri',
    'Ville',
    'Antti',
    'Juho',
    'Markus',
    'Petri',
    'Sami',
    'Timo',
  ];
  const lastNames = [
    'Virtanen',
    'Nieminen',
    'Laine',
    'Korhonen',
    'Mäkinen',
    'Hämäläinen',
    'Heikkinen',
    'Koskinen',
    'Järvinen',
    'Lehtonen',
    'Saarinen',
    'Salminen',
  ];

  for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
    const team = teams[teamIndex];
    if (!team) continue;

    // Determine birth year based on team's division
    const divisionIndex = Math.floor(teamIndex / 3);
    const division = divisions[divisionIndex];
    const birthYear = division?.birthYear || 2006;

    const teamPlayers = await Promise.all([
      db.player.create({
        data: {
          teamId: team.id,
          firstName: firstNames[teamIndex * 3] || 'Player',
          lastName: lastNames[teamIndex * 3] || 'One',
          birthDate: new Date(`${birthYear}-03-15`),
          jerseyNumber: 1,
        },
      }),
      db.player.create({
        data: {
          teamId: team.id,
          firstName: firstNames[teamIndex * 3 + 1] || 'Player',
          lastName: lastNames[teamIndex * 3 + 1] || 'Two',
          birthDate: new Date(`${birthYear}-07-22`),
          jerseyNumber: 10,
        },
      }),
      db.player.create({
        data: {
          teamId: team.id,
          firstName: firstNames[teamIndex * 3 + 2] || 'Player',
          lastName: lastNames[teamIndex * 3 + 2] || 'Three',
          birthDate: new Date(`${birthYear}-11-08`),
          jerseyNumber: 9,
        },
      }),
    ]);
    players.push(...teamPlayers);
  }

  // Create some matches
  const matches = await Promise.all([
    db.match.create({
      data: {
        tournamentId: tournament.id,
        divisionId: divisions[0]!.id,
        groupId: groups[0]!.id,
        homeTeamId: teams[0]!.id,
        awayTeamId: teams[1]!.id,
        venueId: venues[0]!.id,
        startTime: new Date('2024-06-15T14:00:00Z'),
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
      },
    }),
    db.match.create({
      data: {
        tournamentId: tournament.id,
        divisionId: divisions[0]!.id,
        groupId: groups[0]!.id,
        homeTeamId: teams[2]!.id,
        awayTeamId: teams[0]!.id,
        venueId: venues[1]!.id,
        startTime: new Date('2024-06-18T16:00:00Z'),
        status: 'FINISHED',
        homeScore: 0,
        awayScore: 3,
      },
    }),
    db.match.create({
      data: {
        tournamentId: tournament.id,
        divisionId: divisions[0]!.id,
        groupId: groups[0]!.id,
        homeTeamId: teams[1]!.id,
        awayTeamId: teams[2]!.id,
        venueId: venues[0]!.id,
        startTime: new Date('2024-06-22T18:00:00Z'),
        status: 'LIVE',
        homeScore: 1,
        awayScore: 1,
      },
    }),
    db.match.create({
      data: {
        tournamentId: tournament.id,
        divisionId: divisions[0]!.id,
        groupId: groups[1]!.id,
        homeTeamId: teams[3]!.id,
        awayTeamId: teams[4]!.id,
        venueId: venues[2]!.id,
        startTime: new Date('2024-06-16T15:00:00Z'),
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 2,
      },
    }),
    db.match.create({
      data: {
        tournamentId: tournament.id,
        divisionId: divisions[0]!.id,
        groupId: groups[1]!.id,
        homeTeamId: teams[5]!.id,
        awayTeamId: teams[3]!.id,
        venueId: venues[1]!.id,
        startTime: new Date('2024-06-25T14:00:00Z'),
        status: 'SCHEDULED',
        homeScore: 0,
        awayScore: 0,
      },
    }),
  ]);

  // Create some match events
  await Promise.all([
    db.matchEvent.create({
      data: {
        matchId: matches[0]!.id,
        minute: 23,
        type: 'GOAL',
        teamId: teams[0]!.id,
        playerId: players[1]?.id, // Jukka from first team
      },
    }),
    db.matchEvent.create({
      data: {
        matchId: matches[0]!.id,
        minute: 45,
        type: 'GOAL',
        teamId: teams[1]!.id,
        playerId: players[4]?.id, // Jukka from second team
      },
    }),
    db.matchEvent.create({
      data: {
        matchId: matches[0]!.id,
        minute: 78,
        type: 'GOAL',
        teamId: teams[0]!.id,
        playerId: players[2]?.id, // Aleksi from first team
      },
    }),
    db.matchEvent.create({
      data: {
        matchId: matches[1]!.id,
        minute: 15,
        type: 'GOAL',
        teamId: teams[0]!.id,
        playerId: players[1]?.id,
      },
    }),
    db.matchEvent.create({
      data: {
        matchId: matches[1]!.id,
        minute: 32,
        type: 'GOAL',
        teamId: teams[0]!.id,
        playerId: players[2]?.id,
      },
    }),
    db.matchEvent.create({
      data: {
        matchId: matches[1]!.id,
        minute: 67,
        type: 'GOAL',
        teamId: teams[0]!.id,
        playerId: players[1]?.id,
      },
    }),
  ]);

  // Create standings for Group A
  await Promise.all([
    db.standing.create({
      data: {
        teamId: teams[0]!.id, // Helsinki FC
        groupId: groups[0]!.id,
        played: 2,
        won: 2,
        drawn: 0,
        lost: 0,
        goalsFor: 5,
        goalsAgainst: 1,
        goalDifference: 4,
        points: 6,
      },
    }),
    db.standing.create({
      data: {
        teamId: teams[1]!.id, // Espoo United
        groupId: groups[0]!.id,
        played: 2,
        won: 0,
        drawn: 1,
        lost: 1,
        goalsFor: 2,
        goalsAgainst: 3,
        goalDifference: -1,
        points: 1,
      },
    }),
    db.standing.create({
      data: {
        teamId: teams[2]!.id, // Tampere Tigers
        groupId: groups[0]!.id,
        played: 2,
        won: 0,
        drawn: 1,
        lost: 1,
        goalsFor: 1,
        goalsAgainst: 3,
        goalDifference: -2,
        points: 1,
      },
    }),
  ]);

  // Create standings for Group B
  await Promise.all([
    db.standing.create({
      data: {
        teamId: teams[4]!.id, // Oulu Eagles
        groupId: groups[1]!.id,
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 1,
        goalDifference: 1,
        points: 3,
      },
    }),
    db.standing.create({
      data: {
        teamId: teams[3]!.id, // Turku Wolves
        groupId: groups[1]!.id,
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 1,
        goalsAgainst: 2,
        goalDifference: -1,
        points: 0,
      },
    }),
    db.standing.create({
      data: {
        teamId: teams[5]!.id, // Jyväskylä Lions
        groupId: groups[1]!.id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
      },
    }),
  ]);

  // Create tournament assignments
  await Promise.all([
    // Team Manager assigned to manage the first tournament
    db.tournamentAssignment.upsert({
      where: {
        userId_tournamentId: {
          userId: teamManagerUser.id,
          tournamentId: tournament.id,
        },
      },
      update: {},
      create: {
        userId: teamManagerUser.id,
        tournamentId: tournament.id,
        canConfigure: true,
        canManageScores: true,
        isReferee: false,
        assignedBy: adminUser.id,
        permissions: {
          canEditTournament: true,
          canManageTeams: true,
          canManageMatches: true,
          canViewAnalytics: true,
        },
      },
    }),
    // Tournament Admin assigned to operate the first tournament
    db.tournamentAssignment.upsert({
      where: {
        userId_tournamentId: {
          userId: tournamentAdminUser.id,
          tournamentId: tournament.id,
        },
      },
      update: {},
      create: {
        userId: tournamentAdminUser.id,
        tournamentId: tournament.id,
        canConfigure: true,
        canManageScores: true,
        isReferee: false,
        assignedBy: adminUser.id,
        permissions: {
          canUpdateResults: true,
          canManageMatches: true,
          canAssignReferees: true,
          canViewAnalytics: true,
        },
      },
    }),
    // Referee assigned to the first tournament
    db.tournamentAssignment.upsert({
      where: {
        userId_tournamentId: {
          userId: refereeUser.id,
          tournamentId: tournament.id,
        },
      },
      update: {},
      create: {
        userId: refereeUser.id,
        tournamentId: tournament.id,
        canConfigure: false,
        canManageScores: false,
        isReferee: true,
        assignedBy: adminUser.id,
        permissions: {
          canOfficiateMatches: true,
          canUpdateScores: true,
        },
      },
    }),
  ]);

  // Create match assignments for referees
  await Promise.all([
    // Referee assigned to first match as main referee
    db.matchAssignment.create({
      data: {
        userId: refereeUser.id,
        matchId: matches[0]!.id,
        role: 'MAIN_REFEREE',
        assignedBy: adminUser.id,
      },
    }),
    // Referee assigned to second match as assistant referee
    db.matchAssignment.create({
      data: {
        userId: refereeUser.id,
        matchId: matches[1]!.id,
        role: 'ASSISTANT_REFEREE',
        assignedBy: adminUser.id,
      },
    }),
    // Tournament Admin assigned to third match as match commissioner
    db.matchAssignment.create({
      data: {
        userId: tournamentAdminUser.id,
        matchId: matches[2]!.id,
        role: 'MATCH_COMMISSIONER',
        assignedBy: adminUser.id,
      },
    }),
  ]);

  // ===== FC KASIYSI SYYSTURNAUS DATA =====
  console.log('🏆 Creating FC Kasiysi Syysturnaus data...');

  // Create venues for FC Kasiysi tournament
  const fcKasiysiVenues = await Promise.all([
    db.venue.create({
      data: {
        tournamentId: fcKasiysiTournament.id,
        name: 'Helsinki Olympic Stadium',
        streetName: 'Paavo Nurmen tie 1',
        postalCode: '00250',
        city: 'Helsinki',
        countryId: finland.id,
        capacity: 5000,
        description: 'Main venue for FC Kasiysi Syysturnaus',
        facilities: 'Changing rooms, medical room, parking',
        xCoordinate: 24.9263,
        yCoordinate: 60.1921,
      },
    }),
    db.venue.create({
      data: {
        tournamentId: fcKasiysiTournament.id,
        name: 'Töölö Football Ground',
        streetName: 'Töölönkatu 1',
        postalCode: '00250',
        city: 'Helsinki',
        countryId: finland.id,
        capacity: 2000,
        description: 'Secondary venue for FC Kasiysi Syysturnaus',
        facilities: 'Modern facilities, parking',
        xCoordinate: 24.92,
        yCoordinate: 60.19,
      },
    }),
  ]);

  // Create divisions for FC Kasiysi tournament
  const fcKasiysiDivisions = await Promise.all([
    db.division.create({
      data: {
        tournamentId: fcKasiysiTournament.id,
        name: 'Elite Division',
        description: 'Top level Finnish teams',
        level: 'ELITE',
        format: '11v11',
        minTeams: 8,
        maxTeams: 8,
        currentTeams: 8,
        matchDuration: 90,
        breakDuration: 15,
        assignmentType: 'AUTO',
      },
    }),
    db.division.create({
      data: {
        tournamentId: fcKasiysiTournament.id,
        name: 'Competitive Division',
        description: 'Competitive level Finnish teams',
        level: 'COMPETITIVE',
        format: '11v11',
        minTeams: 8,
        maxTeams: 8,
        currentTeams: 8,
        matchDuration: 90,
        breakDuration: 15,
        assignmentType: 'AUTO',
      },
    }),
  ]);

  // Create groups for each division
  const fcKasiysiGroups = await Promise.all([
    // Elite Division Groups
    db.group.create({
      data: {
        divisionId: fcKasiysiDivisions[0]!.id,
        name: 'Elite Group A',
      },
    }),
    db.group.create({
      data: {
        divisionId: fcKasiysiDivisions[0]!.id,
        name: 'Elite Group B',
      },
    }),
    // Competitive Division Groups
    db.group.create({
      data: {
        divisionId: fcKasiysiDivisions[1]!.id,
        name: 'Competitive Group A',
      },
    }),
    db.group.create({
      data: {
        divisionId: fcKasiysiDivisions[1]!.id,
        name: 'Competitive Group B',
      },
    }),
  ]);

  // Elite Finnish teams
  const eliteTeamNames = [
    'HJK Helsinki',
    'FC Inter Turku',
    'KuPS Kuopio',
    'VPS Vaasa',
    'IFK Mariehamn',
    'AC Oulu',
    'SJK Seinäjoki',
    'FC Lahti',
  ];

  // Competitive Finnish teams
  const competitiveTeamNames = [
    'FC Honka Espoo',
    'TPS Turku',
    'RoPS Rovaniemi',
    'KTP Kotka',
    'FC Haka Valkeakoski',
    'Ilves Tampere',
    'FC KTP',
    'PK-35 Vantaa',
  ];

  // Create Elite teams
  const eliteTeams = await Promise.all(
    eliteTeamNames.map((name, index) =>
      db.team.create({
        data: {
          tournamentId: fcKasiysiTournament.id,
          countryId: finland.id,
          name: name,
          shortName: name
            .split(' ')
            .map((w) => w[0])
            .join(''),
          city: [
            'Helsinki',
            'Turku',
            'Kuopio',
            'Vaasa',
            'Mariehamn',
            'Oulu',
            'Seinäjoki',
            'Lahti',
          ][index],
          club: name,
          level: 'Elite',
        },
      })
    )
  );

  // Create Competitive teams
  const competitiveTeams = await Promise.all(
    competitiveTeamNames.map((name, index) =>
      db.team.create({
        data: {
          tournamentId: fcKasiysiTournament.id,
          countryId: finland.id,
          name: name,
          shortName: name
            .split(' ')
            .map((w) => w[0])
            .join(''),
          city: [
            'Espoo',
            'Turku',
            'Rovaniemi',
            'Kotka',
            'Valkeakoski',
            'Tampere',
            'Kotka',
            'Vantaa',
          ][index],
          club: name,
          level: 'Competitive',
        },
      })
    )
  );

  // Assign teams to groups
  // Elite Group A (4 teams)
  await db.group.update({
    where: { id: fcKasiysiGroups[0]!.id },
    data: {
      teams: {
        connect: eliteTeams.slice(0, 4).map((team) => ({ id: team.id })),
      },
    },
  });

  // Elite Group B (4 teams)
  await db.group.update({
    where: { id: fcKasiysiGroups[1]!.id },
    data: {
      teams: {
        connect: eliteTeams.slice(4, 8).map((team) => ({ id: team.id })),
      },
    },
  });

  // Competitive Group A (4 teams)
  await db.group.update({
    where: { id: fcKasiysiGroups[2]!.id },
    data: {
      teams: {
        connect: competitiveTeams.slice(0, 4).map((team) => ({ id: team.id })),
      },
    },
  });

  // Competitive Group B (4 teams)
  await db.group.update({
    where: { id: fcKasiysiGroups[3]!.id },
    data: {
      teams: {
        connect: competitiveTeams.slice(4, 8).map((team) => ({ id: team.id })),
      },
    },
  });

  // Create some sample matches for FC Kasiysi tournament
  const fcKasiysiMatches = await Promise.all([
    // Elite Group A matches
    db.match.create({
      data: {
        tournamentId: fcKasiysiTournament.id,
        divisionId: fcKasiysiDivisions[0]!.id,
        groupId: fcKasiysiGroups[0]!.id,
        homeTeamId: eliteTeams[0]!.id,
        awayTeamId: eliteTeams[1]!.id,
        venueId: fcKasiysiVenues[0]!.id,
        startTime: new Date('2024-09-15T14:00:00Z'),
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
      },
    }),
    db.match.create({
      data: {
        tournamentId: fcKasiysiTournament.id,
        divisionId: fcKasiysiDivisions[0]!.id,
        groupId: fcKasiysiGroups[0]!.id,
        homeTeamId: eliteTeams[2]!.id,
        awayTeamId: eliteTeams[3]!.id,
        venueId: fcKasiysiVenues[1]!.id,
        startTime: new Date('2024-09-15T16:00:00Z'),
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 3,
      },
    }),
    // Competitive Group A matches
    db.match.create({
      data: {
        tournamentId: fcKasiysiTournament.id,
        divisionId: fcKasiysiDivisions[1]!.id,
        groupId: fcKasiysiGroups[2]!.id,
        homeTeamId: competitiveTeams[0]!.id,
        awayTeamId: competitiveTeams[1]!.id,
        venueId: fcKasiysiVenues[0]!.id,
        startTime: new Date('2024-09-16T14:00:00Z'),
        status: 'FINISHED',
        homeScore: 0,
        awayScore: 2,
      },
    }),
    db.match.create({
      data: {
        tournamentId: fcKasiysiTournament.id,
        divisionId: fcKasiysiDivisions[1]!.id,
        groupId: fcKasiysiGroups[2]!.id,
        homeTeamId: competitiveTeams[2]!.id,
        awayTeamId: competitiveTeams[3]!.id,
        venueId: fcKasiysiVenues[1]!.id,
        startTime: new Date('2024-09-16T16:00:00Z'),
        status: 'SCHEDULED',
        homeScore: 0,
        awayScore: 0,
      },
    }),
  ]);

  // Create standings for FC Kasiysi groups
  await Promise.all([
    // Elite Group A standings
    db.standing.create({
      data: {
        teamId: eliteTeams[0]!.id,
        groupId: fcKasiysiGroups[0]!.id,
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 1,
        goalDifference: 1,
        points: 3,
      },
    }),
    db.standing.create({
      data: {
        teamId: eliteTeams[1]!.id,
        groupId: fcKasiysiGroups[0]!.id,
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 1,
        goalsAgainst: 2,
        goalDifference: -1,
        points: 0,
      },
    }),
    // Competitive Group A standings
    db.standing.create({
      data: {
        teamId: competitiveTeams[1]!.id,
        groupId: fcKasiysiGroups[2]!.id,
        played: 1,
        won: 1,
        drawn: 0,
        lost: 0,
        goalsFor: 2,
        goalsAgainst: 0,
        goalDifference: 2,
        points: 3,
      },
    }),
    db.standing.create({
      data: {
        teamId: competitiveTeams[0]!.id,
        groupId: fcKasiysiGroups[2]!.id,
        played: 1,
        won: 0,
        drawn: 0,
        lost: 1,
        goalsFor: 0,
        goalsAgainst: 2,
        goalDifference: -2,
        points: 0,
      },
    }),
  ]);

  console.log('✅ FC Kasiysi Syysturnaus data created successfully!');

  // Seed clubs from CSV
  await seedClubsFromCSV();

  // Get club count for statistics
  const clubCount = await db.club.count();

  console.log('✅ Database seeded successfully!');
  console.log(`📊 Created:
    - 1 organization
    - 4 users (Admin, Team Manager, Tournament Admin, Referee)
    - 11 tournaments (9 published, 2 draft) including FC Kasiysi Syysturnaus
    - 6 venues (4 original + 2 for FC Kasiysi)
    - 6 divisions (4 original + 2 for FC Kasiysi: Elite & Competitive)
    - 16 groups (12 original + 4 for FC Kasiysi)
    - 40 teams (24 original + 16 for FC Kasiysi: 8 Elite + 8 Competitive)
    - 72 players (with appropriate birth dates)
    - 9 matches (5 original + 4 for FC Kasiysi)
    - 6 match events
    - 10 standings (6 original + 4 for FC Kasiysi)
    - 3 tournament assignments
    - 3 match assignments
    - ${clubCount} clubs (from CSV)`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
