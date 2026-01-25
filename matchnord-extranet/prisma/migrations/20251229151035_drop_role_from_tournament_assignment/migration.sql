-- Migration: Drop role column from TournamentAssignment and UserInvitation
-- This migration removes the legacy role columns that have been replaced by permission-based columns

-- Drop role column from TournamentAssignment if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'TournamentAssignment' AND column_name = 'role'
  ) THEN
    ALTER TABLE "TournamentAssignment" DROP COLUMN "role";
  END IF;
END $$;

-- Drop role column from UserInvitation if it exists
-- This fixes the blocking issue where UserInvitation.role depends on old enum values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'UserInvitation' AND column_name = 'role'
  ) THEN
    ALTER TABLE "UserInvitation" DROP COLUMN "role";
  END IF;
END $$;


