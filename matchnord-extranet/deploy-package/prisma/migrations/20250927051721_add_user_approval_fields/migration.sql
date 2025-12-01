-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'TOURNAMENT_MANAGER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;
