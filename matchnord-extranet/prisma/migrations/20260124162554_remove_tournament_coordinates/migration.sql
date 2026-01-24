-- AlterTable
-- Remove unused latitude and longitude fields from Tournament table
-- These fields were never used as tournaments use venue coordinates instead
ALTER TABLE "Tournament" DROP COLUMN IF EXISTS "latitude";
ALTER TABLE "Tournament" DROP COLUMN IF EXISTS "longitude";
