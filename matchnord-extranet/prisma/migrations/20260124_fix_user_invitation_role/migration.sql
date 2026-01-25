-- Fix UserInvitation table: Remove role column if it exists
-- This column was replaced with permission flags (canConfigure, canManageScores, isReferee)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'UserInvitation' AND column_name = 'role'
  ) THEN
    ALTER TABLE "UserInvitation" DROP COLUMN "role";
  END IF;
END $$;
