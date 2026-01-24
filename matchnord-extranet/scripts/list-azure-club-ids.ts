import { BlobServiceClient } from '@azure/storage-blob';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
const envPaths = [
  path.join(process.cwd(), '.env.backup'),
  path.join(process.cwd(), '.env.local'),
  path.join(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (require('fs').existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;

async function main() {
  if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
    console.error('❌ Azure Storage credentials not configured!');
    process.exit(1);
  }

  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerName = 'clubs';
  const containerClient = blobServiceClient.getContainerClient(containerName);

  console.log('📦 Listing club logos in Azure Storage...\n');

  const clubIdMap = new Map<string, string[]>(); // clubId -> [filenames]

  try {
    for await (const blob of containerClient.listBlobsFlat()) {
      // Blob names are in format: {clubId}/{filename}
      const parts = blob.name.split('/');
      if (parts.length === 2) {
        const [clubId, filename] = parts;
        if (!clubIdMap.has(clubId)) {
          clubIdMap.set(clubId, []);
        }
        clubIdMap.get(clubId)!.push(filename);
      }
    }

    console.log(`✅ Found ${clubIdMap.size} unique club IDs in Azure Storage\n`);
    console.log('Sample club IDs:');
    let count = 0;
    for (const [clubId, filenames] of clubIdMap.entries()) {
      if (count++ < 10) {
        console.log(`   ${clubId}: ${filenames.join(', ')}`);
      }
    }
    if (clubIdMap.size > 10) {
      console.log(`   ... and ${clubIdMap.size - 10} more`);
    }

    // Export as JSON for use in import script
    const output = {
      clubIds: Array.from(clubIdMap.keys()),
      totalClubs: clubIdMap.size,
    };

    const outputPath = path.join(process.cwd(), 'azure-club-ids.json');
    require('fs').writeFileSync(outputPath, JSON.stringify(output, null, 2));
    console.log(`\n💾 Saved club IDs to: ${outputPath}`);
  } catch (error: any) {
    console.error('❌ Error listing blobs:', error.message);
    process.exit(1);
  }
}

main();





