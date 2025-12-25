-- Migration: Add permission columns to TournamentAssignment and UserInvitation
-- This migration adds canConfigure, canManageScores, and isReferee columns
-- to replace the role-based system with a permission-based system

-- Step 1: Add new permission columns to TournamentAssignment
ALTER TABLE "TournamentAssignment" 
  ADD COLUMN IF NOT EXISTS "canConfigure" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canManageScores" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isReferee" BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Migrate existing role data to permissions (if role column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'TournamentAssignment' AND column_name = 'role'
  ) THEN
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
  END IF;
END $$;

-- Step 3: Add new permission columns to UserInvitation
ALTER TABLE "UserInvitation"
  ADD COLUMN IF NOT EXISTS "canConfigure" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "canManageScores" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isReferee" BOOLEAN NOT NULL DEFAULT false;

-- Step 4: Ensure tournament owners have proper permissions
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

-- Step 5: Update existing owner assignments to ensure they have full permissions
UPDATE "TournamentAssignment" ta
SET 
  "canConfigure" = true,
  "canManageScores" = true
FROM "Tournament" t
WHERE ta."userId" = t."createdById"
  AND ta."tournamentId" = t."id";

