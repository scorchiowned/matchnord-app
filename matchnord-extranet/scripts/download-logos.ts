import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';

interface TeamLogo {
  name: string;
  imageUrl: string;
}

// Sanitize filename to be filesystem-safe
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100); // Limit length
}

// Extract filename from URL or generate from team name
function getFilename(teamName: string, imageUrl: string): string {
  try {
    const url = new URL(imageUrl);
    const urlPath = url.pathname;
    const urlFilename = path.basename(urlPath);
    
    // If URL has a filename, use it; otherwise use sanitized team name
    if (urlFilename && urlFilename !== '/' && urlFilename.includes('.')) {
      return urlFilename;
    }
    
    // Generate filename from team name
    const sanitized = sanitizeFilename(teamName);
    const ext = path.extname(urlPath) || '.png';
    return `${sanitized}${ext}`;
  } catch {
    // Fallback if URL parsing fails
    const sanitized = sanitizeFilename(teamName);
    return `${sanitized}.png`;
  }
}

// Download a single image
async function downloadImage(
  imageUrl: string,
  filePath: string
): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const url = new URL(imageUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const file = fs.createWriteStream(filePath);
      
      const request = client.get(imageUrl, (response) => {
        // Handle redirects
        if (
          response.statusCode === 301 ||
          response.statusCode === 302 ||
          response.statusCode === 307 ||
          response.statusCode === 308
        ) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(filePath);
            return downloadImage(redirectUrl, filePath).then(resolve);
          }
        }
        
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(filePath);
          console.error(
            `Failed to download ${imageUrl}: Status ${response.statusCode}`
          );
          resolve(false);
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      });
      
      request.on('error', (err) => {
        file.close();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        console.error(`Error downloading ${imageUrl}:`, err.message);
        resolve(false);
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        file.close();
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        console.error(`Timeout downloading ${imageUrl}`);
        resolve(false);
      });
    } catch (error) {
      console.error(`Error processing ${imageUrl}:`, error);
      resolve(false);
    }
  });
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

// Main function
async function main() {
  // CSV is in the parent directory (tournament_software)
  const csvPath = path.join(
    __dirname,
    '../../team_names_and_logos.csv'
  );
  // Logos directory in matchnord-extranet project root
  const logosDir = path.join(__dirname, '../logos');
  
  // Create logos directory if it doesn't exist
  if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
    console.log(`Created directory: ${logosDir}`);
  }
  
  // Parse CSV
  console.log('Parsing CSV file...');
  const teams = parseCSV(csvPath);
  console.log(`Found ${teams.length} teams with logos`);
  
  // Download images
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const filename = getFilename(team.name, team.imageUrl);
    const filePath = path.join(logosDir, filename);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`[${i + 1}/${teams.length}] Skipping ${team.name} (already exists)`);
      skipCount++;
      continue;
    }
    
    process.stdout.write(
      `[${i + 1}/${teams.length}] Downloading ${team.name}... `
    );
    
    const success = await downloadImage(team.imageUrl, filePath);
    
    if (success) {
      console.log('✓');
      successCount++;
    } else {
      console.log('✗');
      failCount++;
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  
  console.log('\n=== Download Summary ===');
  console.log(`Total teams: ${teams.length}`);
  console.log(`Successfully downloaded: ${successCount}`);
  console.log(`Skipped (already exists): ${skipCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`\nLogos saved to: ${logosDir}`);
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

