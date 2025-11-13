import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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
    const line = lines[i].trim();
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
  const csvPath = path.join(
    __dirname,
    '../../team_names_and_logos.csv'
  );
  
  // Get Azure Storage account name from environment
  const azureAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'matchnordstorage';
  const container = 'clubs';
  
  console.log('Parsing CSV file...');
  const teams = parseCSV(csvPath);
  console.log(`Found ${teams.length} teams with logos`);
  
  // Find Finland country
  console.log('Finding Finland country...');
  const finland = await prisma.country.findFirst({
    where: {
      OR: [
        { name: 'Finland' },
        { code: 'FI' },
      ],
    },
  });
  
  if (!finland) {
    console.error('Finland country not found in database. Please create it first.');
    process.exit(1);
  }
  
  console.log(`Found Finland: ${finland.name} (${finland.code})`);
  
  // Import clubs
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    
    try {
      // Get filename from original URL
      const filename = getFilenameFromUrl(team.imageUrl);
      
      // Check if club already exists
      const existingClub = await prisma.club.findUnique({
        where: { name: team.name },
      });
      
      if (existingClub) {
        // Update existing club with logo if it doesn't have one
        if (!existingClub.logo) {
          const blobName = `${existingClub.id}/${filename}`;
          const logoUrl = constructAzureUrl(azureAccountName, container, blobName);
          
          await prisma.club.update({
            where: { id: existingClub.id },
            data: {
              logo: logoUrl,
              countryId: finland.id, // Ensure country is Finland
            },
          });
          
          updatedCount++;
          console.log(`[${i + 1}/${teams.length}] Updated: ${team.name}`);
        } else {
          skippedCount++;
          console.log(`[${i + 1}/${teams.length}] Skipped (already has logo): ${team.name}`);
        }
      } else {
        // Create new club - we'll create it first to get the ID, then update with logo
        const newClub = await prisma.club.create({
          data: {
            name: team.name,
            countryId: finland.id,
          },
        });
        
        // Now update with the logo URL using the club ID
        const blobName = `${newClub.id}/${filename}`;
        const logoUrl = constructAzureUrl(azureAccountName, container, blobName);
        
        await prisma.club.update({
          where: { id: newClub.id },
          data: { logo: logoUrl },
        });
        
        createdCount++;
        console.log(`[${i + 1}/${teams.length}] Created: ${team.name}`);
      }
    } catch (error) {
      errorCount++;
      console.error(`[${i + 1}/${teams.length}] Error processing ${team.name}:`, error);
    }
  }
  
  console.log('\n=== Import Summary ===');
  console.log(`Total teams: ${teams.length}`);
  console.log(`Created: ${createdCount}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
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

