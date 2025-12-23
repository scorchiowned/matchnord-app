-- AlterEnum
-- Add 'USER' back to UserRole enum
-- This fixes the issue where USER was removed in a previous migration
-- but is still needed by the application code
-- 
-- Note: PostgreSQL requires enum values to be committed before use.
-- This migration ONLY adds the enum value. The default value will be
-- set in the next migration (20251223120001_set_user_role_default)
-- which runs in a separate transaction.
--
-- We use a DO block to check if the value exists first to avoid errors
-- if it was already added manually or in a previous attempt.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_enum 
        WHERE enumlabel = 'USER' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'USER';
    END IF;
END $$;

