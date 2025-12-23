-- AlterTable
-- Update default value to 'USER' to match schema
-- This must be in a separate migration because PostgreSQL requires
-- enum values to be committed before they can be used in defaults
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

