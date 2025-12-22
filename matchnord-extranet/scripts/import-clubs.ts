import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import { BlobServiceClient } from '@azure/storage-blob';

// Load environment variables from .env.backup (production)
const envPaths = [
  path.join(process.cwd(), '.env.backup'), // Production
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
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

if (!loadedEnv) {
  config();
}

// Check if DATABASE_URL is set, if not construct it from POSTGRES_PASSWORD
if (!process.env.DATABASE_URL) {
  if (process.env.POSTGRES_PASSWORD) {
    const password = encodeURIComponent(process.env.POSTGRES_PASSWORD);
    process.env.DATABASE_URL = `postgresql://matchnordadmin:${password}@matchnord-db.postgres.database.azure.com:5432/postgres?schema=public`;
    console.log('🔧 Constructed DATABASE_URL from POSTGRES_PASSWORD');
  } else {
    console.error(
      '❌ DATABASE_URL or POSTGRES_PASSWORD environment variable is not set!'
    );
    process.exit(1);
  }
} else {
  // Validate and fix DATABASE_URL if password needs encoding
  const dbUrl = process.env.DATABASE_URL;
  try {
    new URL(dbUrl);
  } catch (e: unknown) {
    const match = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@(.+)/);
    if (match && match[1] && match[2] && match[3]) {
      const [, user, password, rest] = match;
      const encodedPassword = encodeURIComponent(password);
      process.env.DATABASE_URL = `postgresql://${user}:${encodedPassword}@${rest}`;
      console.log('🔧 Fixed DATABASE_URL by encoding password');
    } else {
      console.error('❌ DATABASE_URL is malformed');
      process.exit(1);
    }
  }
}

const prisma = new PrismaClient();

interface TeamLogo {
  name: string;
  imageUrl: string;
}

// Parse CSV file
function parseCSV(filePath: string): TeamLogo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const teams: TeamLogo[] = [];

  // Skip header line (line 1 is empty, line 2 is header)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Handle CSV parsing - team names might contain commas
    // Find the last comma which separates name from URL
    const lastCommaIndex = line.lastIndexOf(',');

    if (lastCommaIndex === -1) continue;

    const name = line.substring(0, lastCommaIndex).trim();
    const imageUrl = line.substring(lastCommaIndex + 1).trim();

    // Remove quotes if present
    const cleanName = name.replace(/^"|"$/g, '');
    const cleanUrl = imageUrl.replace(/^"|"$/g, '');

    if (cleanName && cleanUrl) {
      teams.push({
        name: cleanName,
        imageUrl: cleanUrl,
      });
    }
  }

  return teams;
}

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

// Main function
async function main() {
  const csvPath = path.join(__dirname, '../../team_names_and_logos.csv');

  // Get Azure Storage account name from environment
  const azureAccountName =
    process.env.AZURE_STORAGE_ACCOUNT_NAME || 'matchnordstorage';
  const container = 'clubs';
  const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;

  if (!AZURE_STORAGE_ACCOUNT_KEY) {
    console.error(
      '❌ AZURE_STORAGE_ACCOUNT_KEY is required to fetch club IDs from Azure Storage'
    );
    process.exit(1);
  }

  console.log('🏢 Importing clubs from Azure Storage (source of truth)...\n');
  console.log(
    `📍 Database: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@') || 'unknown'}`
  );
  console.log(`📦 Azure Storage: ${azureAccountName}/${container}\n`);

  // Scan Azure Storage to get all club IDs and their filenames
  console.log('📦 Scanning Azure Storage for club logos...');
  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${azureAccountName};AccountKey=${AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;
  const blobServiceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(container);

  // Map: filename -> { clubId, filename }
  const azureClubsByFilename = new Map<
    string,
    { clubId: string; filename: string }
  >();

  let blobCount = 0;
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

  // Parse CSV to get club names
  console.log('📋 Parsing CSV file...');
  const teams = parseCSV(csvPath);
  console.log(`   Found ${teams.length} teams in CSV\n`);

  // Find Finland country
  console.log('📍 Finding Finland country...');
  const finland = await prisma.country.findFirst({
    where: {
      OR: [{ name: 'Finland' }, { code: 'FI' }],
    },
  });

  if (!finland) {
    console.error(
      'Finland country not found in database. Please create it first.'
    );
    process.exit(1);
  }

  console.log(`   Found Finland: ${finland.name} (${finland.code})\n`);

  // Match CSV entries to Azure Storage entries and create clubs
  console.log('🔄 Creating clubs with IDs from Azure Storage...\n');
  let createdCount = 0;
  let matchedCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    if (!team) continue;

    try {
      // Get filename from CSV URL
      const filename = getFilenameFromUrl(team.imageUrl);
      const filenameKey = filename.toLowerCase();

      // Find matching club ID in Azure Storage by filename
      const azureClub = azureClubsByFilename.get(filenameKey);

      if (azureClub) {
        // Use the exact club ID from Azure Storage
        const { clubId, filename: azureFilename } = azureClub;

        // Create club with the specific ID from Azure Storage using raw SQL
        await prisma.$executeRawUnsafe(
          `INSERT INTO "Club" (id, name, "countryId", logo, "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, $4, NOW(), NOW()) 
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, logo = EXCLUDED.logo, "updatedAt" = NOW()`,
          clubId,
          team.name,
          finland.id,
          constructAzureUrl(
            azureAccountName,
            container,
            `${clubId}/${azureFilename}`
          )
        );

        matchedCount++;
        createdCount++;
        if ((i + 1) % 100 === 0) {
          console.log(`   Processed ${i + 1}/${teams.length}...`);
        }
      } else {
        // No matching logo in Azure Storage - create with new ID
        const newClub = await prisma.club.create({
          data: {
            name: team.name,
            countryId: finland.id,
            logo: constructAzureUrl(
              azureAccountName,
              container,
              `new/${filename}`
            ),
          },
        });
        notFoundCount++;
        createdCount++;
        if ((i + 1) % 50 === 0) {
          console.log(
            `   Processed ${i + 1}/${teams.length}... (${notFoundCount} without Azure match)`
          );
        }
      }
    } catch (error: unknown) {
      errorCount++;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[${i + 1}/${teams.length}] Error processing ${team.name}:`,
        errorMessage
      );
    }
  }

  console.log('\n=== Import Summary ===');
  console.log(`Total teams in CSV: ${teams.length}`);
  console.log(`✅ Created: ${createdCount}`);
  console.log(`   - Matched with Azure Storage IDs: ${matchedCount}`);
  console.log(`   - Created with new IDs (no Azure match): ${notFoundCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  // Show sample clubs
  const sampleClubs = await prisma.club.findMany({
    take: 10,
    where: {
      logo: { not: null },
    },
    orderBy: { name: 'asc' },
  });

  if (sampleClubs.length > 0) {
    console.log('\n📋 Sample clubs:');
    sampleClubs.forEach((club) => {
      const isAzure = club.logo?.includes('blob.core.windows.net');
      console.log(
        `   - ${club.name} (ID: ${club.id.substring(0, 20)}...) ${isAzure ? '✓' : ''}`
      );
    });
  }
}

// Run the script
main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
