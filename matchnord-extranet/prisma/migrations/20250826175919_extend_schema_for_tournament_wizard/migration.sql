/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Organization` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Tournament` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `managerId` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdById` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Tournament` table without a default value. This is not possible if the table is not empty.

*/

-- First, handle existing data by setting default values
-- Create a default admin user if none exists
INSERT INTO "User" ("id", "name", "email", "role", "createdAt", "updatedAt")
SELECT 'default-admin', 'Default Admin', 'admin@default.com', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "User" WHERE "role" = 'ADMIN' LIMIT 1);

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DivisionLevel" AS ENUM ('ELITE', 'COMPETITIVE', 'CHALLENGE', 'RECREATIONAL');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('REGISTRATION', 'EXTRA', 'LATE_FEE', 'DISCOUNT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'BANK_TRANSFER', 'INVOICE', 'CASH');

-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'POSTPONED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RegistrationStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "RegistrationStatus" ADD VALUE 'WAITLISTED';

-- AlterEnum
ALTER TYPE "StageType" ADD VALUE 'PLAYOFF';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'TEAM_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'TOURNAMENT_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'REFEREE';
ALTER TYPE "UserRole" ADD VALUE 'VIEWER';

-- DropForeignKey
ALTER TABLE "Division" DROP CONSTRAINT "Division_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_stageId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT "Match_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Player" DROP CONSTRAINT "Player_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduleSlot" DROP CONSTRAINT "ScheduleSlot_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "Stage" DROP CONSTRAINT "Stage_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_tournamentId_fkey";

-- DropForeignKey
ALTER TABLE "Venue" DROP CONSTRAINT "Venue_tournamentId_fkey";

-- AlterTable
ALTER TABLE "Division" ADD COLUMN     "ageGroup" TEXT,
ADD COLUMN     "currentTeams" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "format" TEXT,
ADD COLUMN     "level" "DivisionLevel" NOT NULL DEFAULT 'COMPETITIVE',
ADD COLUMN     "maxTeams" INTEGER NOT NULL DEFAULT 16,
ADD COLUMN     "minTeams" INTEGER NOT NULL DEFAULT 4;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "pitchId" TEXT,
ADD COLUMN     "referee" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "Player" ADD COLUMN     "position" TEXT;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "city" TEXT,
ADD COLUMN     "club" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "divisionId" TEXT,
ADD COLUMN     "isWaitlisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "ScheduleSlot" ADD COLUMN     "pitchId" TEXT;

-- AlterTable
ALTER TABLE "Stage" ADD COLUMN     "description" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "city" TEXT,
ADD COLUMN     "club" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "managerId" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "allowWaitlist" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "autoAcceptTeams" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "heroImage" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "maxTeams" INTEGER,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "registrationDeadline" TIMESTAMP(3),
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "accessibility" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "facilities" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "parking" TEXT;

-- CreateTable
CREATE TABLE "UserOrganization" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pitch" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT,
    "surface" TEXT,
    "size" TEXT,
    "description" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "divisionId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "type" "FeeType" NOT NULL DEFAULT 'REGISTRATION',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "registrationId" TEXT,
    "feeId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod",
    "provider" TEXT,
    "providerId" TEXT,
    "providerData" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON "UserOrganization"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_slug_key" ON "Tournament"("slug");

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stage" ADD CONSTRAINT "Stage_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pitch" ADD CONSTRAINT "Pitch_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleSlot" ADD CONSTRAINT "ScheduleSlot_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Now update existing data with default values
-- Update existing organizations with default slugs
UPDATE "Organization" 
SET "slug" = CONCAT('org-', "id")
WHERE "slug" IS NULL;

-- Update existing tournaments with default slugs and createdById
UPDATE "Tournament" 
SET 
  "slug" = CONCAT('tournament-', "id"),
  "createdById" = (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' LIMIT 1)
WHERE "slug" IS NULL OR "createdById" IS NULL;

-- Update existing registrations with default managerId
UPDATE "Registration" 
SET "managerId" = (SELECT "id" FROM "User" WHERE "role" = 'ADMIN' LIMIT 1)
WHERE "managerId" IS NULL;
