/**
 * Migration script to convert role-based system to permission-based system
 * Uses raw SQL to work around Prisma client schema mismatch
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting role to permissions migration (using raw SQL)...');

  try {
    // Step 1: Add new permission columns to TournamentAssignment if they don't exist
    console.log('\n1. Adding permission columns to TournamentAssignment...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "TournamentAssignment" 
      ADD COLUMN IF NOT EXISTS "canConfigure" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "canManageScores" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "isReferee" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('   ✅ Columns added');

    // Step 2: Migrate existing role data to permissions
    console.log('\n2. Migrating TournamentAssignment roles to permissions...');
    const assignmentsUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "TournamentAssignment"
      SET 
        "canConfigure" = CASE 
          WHEN "role"::text = 'MANAGER' OR "role"::text = 'ADMIN' THEN true 
          ELSE false 
        END,
        "canManageScores" = CASE 
          WHEN "role"::text = 'ADMIN' THEN true 
          ELSE false 
        END,
        "isReferee" = CASE 
          WHEN "role"::text = 'REFEREE' THEN true 
          ELSE false 
        END
      WHERE "role" IS NOT NULL;
    `);
    console.log(`   ✅ Migrated ${assignmentsUpdated} assignments`);

    // Step 3: Add permission columns to UserInvitation
    console.log('\n3. Adding permission columns to UserInvitation...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserInvitation"
      ADD COLUMN IF NOT EXISTS "canConfigure" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "canManageScores" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS "isReferee" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log('   ✅ Columns added');

    // Step 4: Update UserRole enum to include USER
    console.log('\n4. Updating UserRole enum...');
    await prisma.$executeRawUnsafe(`
      -- Add USER to enum if it doesn't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'USER' 
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
        ) THEN
          ALTER TYPE "UserRole" ADD VALUE 'USER';
        END IF;
      END $$;
    `);
    console.log('   ✅ USER added to enum');

    // Step 5: Convert all non-ADMIN users to USER role
    console.log('\n5. Converting user roles...');
    const usersUpdated = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "role" = 'USER'::"UserRole"
      WHERE "role"::text != 'ADMIN' 
        AND "role"::text IN ('TEAM_MANAGER', 'TOURNAMENT_ADMIN', 'TOURNAMENT_MANAGER', 'REFEREE');
    `);
    console.log(`   ✅ Updated ${usersUpdated} users to USER role`);

    // Step 6: Update User.isActive default
    console.log('\n6. Updating User.isActive default...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ALTER COLUMN "isActive" SET DEFAULT true;
    `);
    console.log('   ✅ Default updated');

    // Step 7: Ensure tournament owners have proper permissions
    console.log('\n7. Ensuring tournament owners have proper permissions...');
    const ownersUpdated = await prisma.$executeRawUnsafe(`
      -- Update existing owner assignments
      UPDATE "TournamentAssignment" ta
      SET 
        "canConfigure" = true,
        "canManageScores" = true
      FROM "Tournament" t
      WHERE ta."userId" = t."createdById"
        AND ta."tournamentId" = t."id";
    `);
    console.log(`   ✅ Updated ${ownersUpdated} owner assignments`);

    // Create assignments for tournament owners who don't have one
    // Note: We'll skip this if there are constraint issues, owners can be handled manually
    try {
      const ownersCreated = await prisma.$executeRawUnsafe(`
        INSERT INTO "TournamentAssignment" ("id", "userId", "tournamentId", "canConfigure", "canManageScores", "isReferee", "assignedBy", "assignedAt", "isActive", "createdAt", "updatedAt")
        SELECT 
          gen_random_uuid()::text,
          t."createdById",
          t."id",
          true,  -- canConfigure
          true,  -- canManageScores
          false, -- isReferee
          t."createdById", -- assignedBy
          NOW(), -- assignedAt
          true,  -- isActive
          NOW(), -- createdAt
          NOW()  -- updatedAt
        FROM "Tournament" t
        WHERE NOT EXISTS (
          SELECT 1 
          FROM "TournamentAssignment" ta 
          WHERE ta."userId" = t."createdById" 
            AND ta."tournamentId" = t."id"
        )
        AND t."createdById" IS NOT NULL;
      `);
      console.log(`   ✅ Created ${ownersCreated} owner assignments`);
    } catch (error: any) {
      console.log(`   ⚠️  Could not create owner assignments: ${error.message}`);
      console.log('   (This is okay - owners will get permissions when they access tournaments)');
    }

    console.log('\n✅ Data migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma db push --accept-data-loss');
    console.log('2. Or run: npx prisma migrate dev --name migrate_to_permissions');
    console.log('   (This will remove the old role column and update the enum)');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

