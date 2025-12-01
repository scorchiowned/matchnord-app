-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('AUTO', 'MANUAL');

-- AlterTable
ALTER TABLE "Division" ADD COLUMN     "assignmentType" "AssignmentType" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "breakDuration" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "matchDuration" INTEGER NOT NULL DEFAULT 90;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "assignmentType" "AssignmentType" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "scheduledBy" TEXT;
