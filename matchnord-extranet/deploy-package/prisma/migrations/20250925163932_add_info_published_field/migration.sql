/*
  Warnings:

  - The values [REGISTRATION_OPEN,REGISTRATION_CLOSED,IN_PROGRESS,COMPLETED] on the enum `TournamentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isPublished` on the `Announcement` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Rule` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `publicationSettings` on the `Tournament` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TournamentStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
ALTER TABLE "Tournament" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Tournament" ALTER COLUMN "status" TYPE "TournamentStatus_new" USING ("status"::text::"TournamentStatus_new");
ALTER TYPE "TournamentStatus" RENAME TO "TournamentStatus_old";
ALTER TYPE "TournamentStatus_new" RENAME TO "TournamentStatus";
DROP TYPE "TournamentStatus_old";
ALTER TABLE "Tournament" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "Announcement" DROP COLUMN "isPublished";

-- AlterTable
ALTER TABLE "Rule" DROP COLUMN "isPublished";

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "isPublished",
DROP COLUMN "publicationSettings",
ADD COLUMN     "infoPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "schedulePublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teamsPublished" BOOLEAN NOT NULL DEFAULT false;
