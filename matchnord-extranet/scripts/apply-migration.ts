/**
 * Script to apply the permission migration
 * This runs the SQL migration and then applies schema changes
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying permission migration...');

  try {
    // Read the migration SQL file
    const migrationPath = join(
      __dirname,
      '../migrations/20251124190159_migrate_to_permissions/migration.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`);
          await prisma.$executeRawUnsafe(statement);
        } catch (error: any) {
          // Some statements might fail if columns already exist, etc.
          if (
            error.message?.includes('already exists') ||
            error.message?.includes('does not exist') ||
            error.message?.includes('duplicate')
          ) {
            console.log(`  ⚠️  Statement skipped: ${error.message}`);
          } else {
            console.error(`  ❌ Error in statement ${i + 1}:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('\nNext step: Run `npx prisma db push --accept-data-loss` to sync schema');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

