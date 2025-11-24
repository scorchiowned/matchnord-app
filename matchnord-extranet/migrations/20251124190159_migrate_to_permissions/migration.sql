-- Migration: Convert role-based system to permission-based system

-- Step 1: Add new permission columns to TournamentAssignment
ALTER TABLE "TournamentAssignment" 
  ADD COLUMN IF NOT EXISTS "canConfigure" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canManageScores" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isReferee" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Migrate existing role data to permissions
UPDATE "TournamentAssignment"
SET 
  "canConfigure" = CASE 
    WHEN "role" = 'MANAGER' OR "role" = 'ADMIN' THEN true 
    ELSE false 
  END,
  "canManageScores" = CASE 
    WHEN "role" = 'ADMIN' THEN true 
    ELSE false 
  END,
  "isReferee" = CASE 
    WHEN "role" = 'REFEREE' THEN true 
    ELSE false 
  END
WHERE "role" IS NOT NULL;

-- Step 3: Add new permission columns to UserInvitation
ALTER TABLE "UserInvitation"
  ADD COLUMN IF NOT EXISTS "canConfigure" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canManageScores" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isReferee" BOOLEAN NOT NULL DEFAULT false;

-- Step 4: Migrate UserInvitation role data (set defaults, will be updated by application)
-- Note: UserInvitation role field will be removed in schema but kept in DB for now

-- Step 5: Convert all non-ADMIN users to USER role
UPDATE "User"
SET "role" = 'USER'
WHERE "role" != 'ADMIN' AND "role" IN ('TEAM_MANAGER', 'TOURNAMENT_ADMIN', 'TOURNAMENT_MANAGER', 'REFEREE');

-- Step 6: Update UserRole enum - remove old values and add USER
-- First, create new enum type
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'ADMIN');

-- Step 7: Update User table to use new enum
ALTER TABLE "User" 
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole_new" USING (
    CASE 
      WHEN "role"::text = 'ADMIN' THEN 'ADMIN'::"UserRole_new"
      ELSE 'USER'::"UserRole_new"
    END
  ),
  ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole_new";

-- Step 8: Drop old enum and rename new one
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 9: Update User.isActive default (was false for team managers, now true for all)
ALTER TABLE "User" 
  ALTER COLUMN "isActive" SET DEFAULT true;

-- Step 10: Remove role column from TournamentAssignment (after data migration)
ALTER TABLE "TournamentAssignment" DROP COLUMN IF EXISTS "role";

-- Step 11: Ensure tournament owners have proper permissions
-- Create assignments for tournament owners who don't have one
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
);

-- Step 12: Update existing owner assignments to ensure they have full permissions
UPDATE "TournamentAssignment" ta
SET 
  "canConfigure" = true,
  "canManageScores" = true
FROM "Tournament" t
WHERE ta."userId" = t."createdById"
  AND ta."tournamentId" = t."id";

