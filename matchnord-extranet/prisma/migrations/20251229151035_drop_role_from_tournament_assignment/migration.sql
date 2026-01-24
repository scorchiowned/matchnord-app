-- Migration: Drop role column from TournamentAssignment
-- This migration removes the legacy role column that has been replaced by permission-based columns

-- Drop role column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'TournamentAssignment' AND column_name = 'role'
  ) THEN
    ALTER TABLE "TournamentAssignment" DROP COLUMN "role";
  END IF;
END $$;


