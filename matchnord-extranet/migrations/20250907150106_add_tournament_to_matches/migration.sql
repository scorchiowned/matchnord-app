/*
  Warnings:

  - The values [USER,VIEWER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `ageGroup` on the `Division` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Organization` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Venue` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Venue` table. All the data in the column will be lost.
  - Added the required column `tournamentId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryId` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryId` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryId` to the `Tournament` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryId` to the `Venue` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TournamentRole" AS ENUM ('MANAGER', 'ADMIN', 'REFEREE', 'VIEWER');

-- CreateEnum
CREATE TYPE "MatchRole" AS ENUM ('MAIN_REFEREE', 'ASSISTANT_REFEREE', 'FOURTH_OFFICIAL', 'MATCH_COMMISSIONER');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'TEAM_MANAGER', 'TOURNAMENT_ADMIN', 'REFEREE');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'REFEREE';
COMMIT;

-- AlterTable
ALTER TABLE "Division" DROP COLUMN "ageGroup",
ADD COLUMN     "birthYear" INTEGER;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "tournamentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Organization" DROP COLUMN "country",
ADD COLUMN     "countryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "country",
ADD COLUMN     "countryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "countryId" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'REFEREE';

-- AlterTable
ALTER TABLE "Venue" DROP COLUMN "address",
DROP COLUMN "country",
DROP COLUMN "latitude",
DROP COLUMN "longitude",
ADD COLUMN     "countryId" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "streetName" TEXT,
ADD COLUMN     "xCoordinate" DOUBLE PRECISION,
ADD COLUMN     "yCoordinate" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "flag" TEXT,
    "phoneCode" TEXT,
    "currency" TEXT,
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "role" "TournamentRole" NOT NULL,
    "permissions" JSONB,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "role" "MatchRole" NOT NULL,
    "assignedBy" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "Country"("code");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentAssignment_userId_tournamentId_key" ON "TournamentAssignment"("userId", "tournamentId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchAssignment_userId_matchId_key" ON "MatchAssignment"("userId", "matchId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAssignment" ADD CONSTRAINT "TournamentAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentAssignment" ADD CONSTRAINT "TournamentAssignment_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAssignment" ADD CONSTRAINT "MatchAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAssignment" ADD CONSTRAINT "MatchAssignment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
