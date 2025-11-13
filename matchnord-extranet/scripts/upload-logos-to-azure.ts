import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { BlobServiceClient } from '@azure/storage-blob';
import * as dotenv from 'dotenv';

// Load environment variables from .env files (load .env.local first, then .env)
dotenv.config({ path: path.join(__dirname, '../.env.local') });
dotenv.config({ path: path.join(__dirname, '../.env') });

// Get environment variables
const AZURE_STORAGE_ACCOUNT_NAME = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const AZURE_STORAGE_ACCOUNT_KEY = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const prisma = new PrismaClient();

// Initialize Azure Storage client
function getAzureBlobServiceClient(): BlobServiceClient | null {
  if (!AZURE_STORAGE_ACCOUNT_NAME || !AZURE_STORAGE_ACCOUNT_KEY) {
    console.error('Azure Storage credentials not configured!');
    console.error('Please set AZURE_STORAGE_ACCOUNT_NAME and AZURE_STORAGE_ACCOUNT_KEY environment variables.');
    return null;
  }

  const connectionString = `DefaultEndpointsProtocol=https;AccountName=${AZURE_STORAGE_ACCOUNT_NAME};AccountKey=${AZURE_STORAGE_ACCOUNT_KEY};EndpointSuffix=core.windows.net`;
  return BlobServiceClient.fromConnectionString(connectionString);
}

// Extract filename from Azure URL
function getFilenameFromUrl(logoUrl: string | null): string | null {
  if (!logoUrl) return null;
  
  try {
    const url = new URL(logoUrl);
    const pathParts = url.pathname.split('/');
    return pathParts[pathParts.length - 1];
  } catch {
    return null;
  }
}

// Ensure container exists
async function ensureContainerExists(
  blobServiceClient: BlobServiceClient,
  containerName: string
): Promise<void> {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
  console.log(`Container '${containerName}' ready`);
}

// Upload file to Azure Storage
async function uploadFileToAzure(
  blobServiceClient: BlobServiceClient,
  containerName: string,
  blobName: string,
  filePath: string
): Promise<boolean> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    
    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    // Upload file
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });
    
    return true;
  } catch (error) {
    console.error(`Error uploading ${blobName}:`, error);
    return false;
  }
}

// Check if blob already exists
async function blobExists(
  blobServiceClient: BlobServiceClient,
  containerName: string,
  blobName: string
): Promise<boolean> {
  try {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.exists();
  } catch {
    return false;
  }
}

// Main function
async function main() {
  const logosDir = path.join(__dirname, '../logos');
  const containerName = 'clubs';
  
  // Check if logos directory exists
  if (!fs.existsSync(logosDir)) {
    console.error(`Logos directory not found: ${logosDir}`);
    process.exit(1);
  }
  
  // Initialize Azure Storage
  const blobServiceClient = getAzureBlobServiceClient();
  if (!blobServiceClient) {
    process.exit(1);
  }
  
  // Ensure container exists
  await ensureContainerExists(blobServiceClient, containerName);
  
  // Get all clubs from database
  console.log('Fetching clubs from database...');
  const clubs = await prisma.club.findMany({
    where: {
      logo: { not: null },
    },
    select: {
      id: true,
      name: true,
      logo: true,
    },
  });
  
  console.log(`Found ${clubs.length} clubs with logo URLs`);
  
  // Get list of files in logos directory
  const logoFiles = fs.readdirSync(logosDir);
  console.log(`Found ${logoFiles.length} logo files in directory`);
  
  // Create a map of filename to file path for quick lookup
  const fileMap = new Map<string, string>();
  for (const file of logoFiles) {
    fileMap.set(file.toLowerCase(), path.join(logosDir, file));
  }
  
  // Upload logos
  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let notFoundCount = 0;
  
  for (let i = 0; i < clubs.length; i++) {
    const club = clubs[i];
    const filename = getFilenameFromUrl(club.logo);
    
    if (!filename) {
      console.log(`[${i + 1}/${clubs.length}] Skipping ${club.name} (no filename in URL)`);
      skippedCount++;
      continue;
    }
    
    // Find matching file (case-insensitive)
    const filePath = fileMap.get(filename.toLowerCase());
    
    if (!filePath) {
      console.log(`[${i + 1}/${clubs.length}] File not found for ${club.name}: ${filename}`);
      notFoundCount++;
      continue;
    }
    
    // Construct blob name: clubs/{clubId}/{filename}
    const blobName = `${club.id}/${filename}`;
    
    // Check if already uploaded
    const exists = await blobExists(blobServiceClient, containerName, blobName);
    if (exists) {
      console.log(`[${i + 1}/${clubs.length}] Already exists: ${club.name}`);
      skippedCount++;
      continue;
    }
    
    // Upload file
    process.stdout.write(`[${i + 1}/${clubs.length}] Uploading ${club.name}... `);
    const success = await uploadFileToAzure(
      blobServiceClient,
      containerName,
      blobName,
      filePath
    );
    
    if (success) {
      console.log('✓');
      uploadedCount++;
    } else {
      console.log('✗');
      errorCount++;
    }
    
    // Small delay to avoid overwhelming Azure
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  
  console.log('\n=== Upload Summary ===');
  console.log(`Total clubs: ${clubs.length}`);
  console.log(`Uploaded: ${uploadedCount}`);
  console.log(`Skipped (already exists): ${skippedCount}`);
  console.log(`Not found: ${notFoundCount}`);
  console.log(`Errors: ${errorCount}`);
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

