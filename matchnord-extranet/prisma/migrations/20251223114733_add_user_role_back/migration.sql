-- AlterEnum
-- Add 'USER' back to UserRole enum if it doesn't exist
-- Note: PostgreSQL doesn't support IF NOT EXISTS for enum values,
-- so we use a DO block to check first
DO $$ 
BEGIN
    -- Check if 'USER' value exists in the enum
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'USER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'USER';
    END IF;
END $$;

-- AlterTable
-- Update default value to 'USER' to match schema
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Note: We don't update existing users here because:
-- 1. If they have 'ADMIN', we want to keep it
-- 2. If they have other values (TEAM_MANAGER, TOURNAMENT_ADMIN, etc.), 
--    those are still valid enum values and won't cause errors
-- 3. New users will get 'USER' by default

