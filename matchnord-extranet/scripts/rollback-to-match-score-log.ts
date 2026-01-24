/**
 * Script to rollback migrations to 20251123082005_add_match_score_log
 * This will undo the changes from:
 * - 20251207181829_reverting_back
 * - 20251207190000_restore_permission_fields
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🔄 Rolling back to migration: 20251123082005_add_match_score_log'
  );
  console.log('This will undo changes from:');
  console.log('  - 20251207181829_reverting_back');
  console.log('  - 20251207190000_restore_permission_fields');
  console.log('');

  try {
    // Step 1: Undo the changes from 20251207190000_restore_permission_fields
    console.log('Step 1: Undoing changes from restore_permission_fields...');

    // Remove permission columns from TournamentAssignment if they exist
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'TournamentAssignment' AND column_name = 'canConfigure'
        ) THEN
          ALTER TABLE "TournamentAssignment" DROP COLUMN "canConfigure";
        END IF;
        
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'TournamentAssignment' AND column_name = 'canManageScores'
        ) THEN
          ALTER TABLE "TournamentAssignment" DROP COLUMN "canManageScores";
        END IF;
        
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'TournamentAssignment' AND column_name = 'isReferee'
        ) THEN
          ALTER TABLE "TournamentAssignment" DROP COLUMN "isReferee";
        END IF;
      END $$;
    `);

    // Revert UserRole enum back to what it was before restore_permission_fields
    // (It should have USER and ADMIN, but we need to check what it was before)
    // Actually, looking at the migration, it changed from multiple roles to just USER/ADMIN
    // So we'll leave it as is for now since we're rolling back further

    console.log('✅ Step 1 complete');

    // Step 2: Undo the changes from 20251207181829_reverting_back
    console.log('Step 2: Undoing changes from reverting_back...');

    // Restore MatchScoreLog table (it was dropped in reverting_back)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "MatchScoreLog" (
        "id" TEXT NOT NULL,
        "matchId" TEXT NOT NULL,
        "homeScore" INTEGER NOT NULL,
        "awayScore" INTEGER NOT NULL,
        "updatedById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MatchScoreLog_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MatchScoreLog_matchId_idx" ON "MatchScoreLog"("matchId");
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'MatchScoreLog_matchId_fkey'
        ) THEN
          ALTER TABLE "MatchScoreLog" 
          ADD CONSTRAINT "MatchScoreLog_matchId_fkey" 
          FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'MatchScoreLog_updatedById_fkey'
        ) THEN
          ALTER TABLE "MatchScoreLog" 
          ADD CONSTRAINT "MatchScoreLog_updatedById_fkey" 
          FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    // Restore divisionId and matchNumber columns to Match table
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Match' AND column_name = 'divisionId'
        ) THEN
          ALTER TABLE "Match" ADD COLUMN "divisionId" TEXT;
          ALTER TABLE "Match" 
            ADD CONSTRAINT "Match_divisionId_fkey" 
            FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Match' AND column_name = 'matchNumber'
        ) THEN
          ALTER TABLE "Match" ADD COLUMN "matchNumber" TEXT;
        END IF;
      END $$;
    `);

    // Make homeTeamId, awayTeamId, and startTime nullable again
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Match' AND column_name = 'homeTeamId' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE "Match" ALTER COLUMN "homeTeamId" DROP NOT NULL;
        END IF;
        
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Match' AND column_name = 'awayTeamId' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE "Match" ALTER COLUMN "awayTeamId" DROP NOT NULL;
        END IF;
        
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Match' AND column_name = 'startTime' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE "Match" ALTER COLUMN "startTime" DROP NOT NULL;
        END IF;
      END $$;
    `);

    // Restore groupId to be NOT NULL if it was made nullable
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'Match' AND column_name = 'groupId' AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE "Match" ALTER COLUMN "groupId" SET NOT NULL;
        END IF;
      END $$;
    `);

    // Drop Registration table if it exists (it was created in reverting_back)
    await prisma.$executeRawUnsafe(`
      DROP TABLE IF EXISTS "Registration" CASCADE;
    `);

    // Restore UserRole enum to include USER and ADMIN (remove other values if they exist)
    // This is complex, so we'll handle it carefully
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Check if UserRole enum exists and has the right values
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
          -- If the enum doesn't have USER, add it
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'USER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
          ) THEN
            ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'USER';
          END IF;
          
          -- If the enum doesn't have ADMIN, add it
          IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'ADMIN' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
          ) THEN
            ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ADMIN';
          END IF;
        END IF;
      END $$;
    `);

    // Set default UserRole to USER
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole";
    `);

    console.log('✅ Step 2 complete');

    // Step 3: Restore all the dropped columns and tables from reverting_back
    console.log('Step 3: Restoring dropped columns and tables...');

    // Restore enums first (before using them)
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TeamStatus') THEN
          CREATE TYPE "TeamStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITLISTED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InvitationStatus') THEN
          CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');
        END IF;
      END $$;
    `);

    // Restore Team columns
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Restore Team columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'approvedAt') THEN
          ALTER TABLE "Team" ADD COLUMN "approvedAt" TIMESTAMP(3);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'billingAddress') THEN
          ALTER TABLE "Team" ADD COLUMN "billingAddress" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'billingCity') THEN
          ALTER TABLE "Team" ADD COLUMN "billingCity" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'billingEmail') THEN
          ALTER TABLE "Team" ADD COLUMN "billingEmail" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'billingName') THEN
          ALTER TABLE "Team" ADD COLUMN "billingName" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'billingPostalCode') THEN
          ALTER TABLE "Team" ADD COLUMN "billingPostalCode" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'clubId') THEN
          ALTER TABLE "Team" ADD COLUMN "clubId" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'contactAddress') THEN
          ALTER TABLE "Team" ADD COLUMN "contactAddress" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'contactCity') THEN
          ALTER TABLE "Team" ADD COLUMN "contactCity" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'contactEmail') THEN
          ALTER TABLE "Team" ADD COLUMN "contactEmail" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'contactFirstName') THEN
          ALTER TABLE "Team" ADD COLUMN "contactFirstName" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'contactLastName') THEN
          ALTER TABLE "Team" ADD COLUMN "contactLastName" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'contactPhone') THEN
          ALTER TABLE "Team" ADD COLUMN "contactPhone" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'contactPostalCode') THEN
          ALTER TABLE "Team" ADD COLUMN "contactPostalCode" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'divisionId') THEN
          ALTER TABLE "Team" ADD COLUMN "divisionId" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'isWaitlisted') THEN
          ALTER TABLE "Team" ADD COLUMN "isWaitlisted" BOOLEAN NOT NULL DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'logo') THEN
          ALTER TABLE "Team" ADD COLUMN "logo" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'notes') THEN
          ALTER TABLE "Team" ADD COLUMN "notes" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'rejectedAt') THEN
          ALTER TABLE "Team" ADD COLUMN "rejectedAt" TIMESTAMP(3);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'status') THEN
          ALTER TABLE "Team" ADD COLUMN "status" "TeamStatus" NOT NULL DEFAULT 'PENDING';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Team' AND column_name = 'submittedAt') THEN
          ALTER TABLE "Team" ADD COLUMN "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `);

    // Restore Tournament columns
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tournament' AND column_name = 'infoPublished') THEN
          ALTER TABLE "Tournament" ADD COLUMN "infoPublished" BOOLEAN NOT NULL DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tournament' AND column_name = 'registrationInfo') THEN
          ALTER TABLE "Tournament" ADD COLUMN "registrationInfo" TEXT;
        END IF;
      END $$;
    `);

    // Restore User columns
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'approvedAt') THEN
          ALTER TABLE "User" ADD COLUMN "approvedAt" TIMESTAMP(3);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'approvedBy') THEN
          ALTER TABLE "User" ADD COLUMN "approvedBy" TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'isActive') THEN
          ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
        END IF;
      END $$;
    `);

    // Restore Payment teamId column
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'teamId') THEN
          ALTER TABLE "Payment" ADD COLUMN "teamId" TEXT;
        END IF;
        -- Remove registrationId if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'registrationId') THEN
          ALTER TABLE "Payment" DROP COLUMN "registrationId";
        END IF;
      END $$;
    `);

    // Restore Club table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Club" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "shortName" TEXT,
        "logo" TEXT,
        "city" TEXT,
        "countryId" TEXT NOT NULL,
        "website" TEXT,
        "description" TEXT,
        "foundedYear" INTEGER,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "Club_name_key" ON "Club"("name");`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Club_name_idx" ON "Club"("name");`
    );
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Club_countryId_idx" ON "Club"("countryId");`
    );

    // Restore EmailVerificationToken table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "usedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");`
    );
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_userId_token_key" ON "EmailVerificationToken"("userId", "token");`
    );

    // Restore UserInvitation table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserInvitation" (
        "id" TEXT NOT NULL,
        "inviterId" TEXT NOT NULL,
        "invitedUserId" TEXT,
        "email" TEXT NOT NULL,
        "tournamentId" TEXT,
        "canConfigure" BOOLEAN NOT NULL DEFAULT false,
        "canManageScores" BOOLEAN NOT NULL DEFAULT false,
        "isReferee" BOOLEAN NOT NULL DEFAULT false,
        "teamId" TEXT,
        "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
        "token" TEXT NOT NULL,
        "expires" TIMESTAMP(3) NOT NULL,
        "acceptedAt" TIMESTAMP(3),
        "rejectedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "UserInvitation_pkey" PRIMARY KEY ("id")
      );
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UserInvitation_token_key" ON "UserInvitation"("token");`
    );
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UserInvitation_email_token_key" ON "UserInvitation"("email", "token");`
    );

    // Add foreign key constraints
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Team_clubId_fkey') THEN
          ALTER TABLE "Team" ADD CONSTRAINT "Team_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Team_divisionId_fkey') THEN
          ALTER TABLE "Team" ADD CONSTRAINT "Team_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Payment_teamId_fkey') THEN
          ALTER TABLE "Payment" ADD CONSTRAINT "Payment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Club_countryId_fkey') THEN
          ALTER TABLE "Club" ADD CONSTRAINT "Club_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EmailVerificationToken_userId_fkey') THEN
          ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserInvitation_inviterId_fkey') THEN
          ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserInvitation_invitedUserId_fkey') THEN
          ALTER TABLE "UserInvitation" ADD CONSTRAINT "UserInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    // Drop RegistrationStatus enum if it exists
    await prisma.$executeRawUnsafe(`
      DROP TYPE IF EXISTS "RegistrationStatus" CASCADE;
    `);

    console.log('✅ Step 3 complete');

    // Step 4: Mark migrations as rolled back in _prisma_migrations table
    console.log('Step 4: Marking migrations as rolled back...');

    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name IN (
        '20251207181829_reverting_back',
        '20251207190000_restore_permission_fields'
      );
    `);

    console.log('✅ Step 4 complete');
    console.log('');
    console.log('✅ Rollback complete!');
    console.log('');
    console.log('Next steps:');
    console.log(
      '  1. Run: npx prisma migrate resolve --rolled-back 20251207181829_reverting_back'
    );
    console.log(
      '  2. Run: npx prisma migrate resolve --rolled-back 20251207190000_restore_permission_fields'
    );
    console.log('  3. Run: npx prisma generate');
    console.log(
      '  4. Verify your schema matches the state at 20251123082005_add_match_score_log'
    );
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});









