/*
  Warnings:

  - Added the required column `divisionId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Made the column `groupId` on table `Match` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_awayTeamId_fkey";

-- DropForeignKey
ALTER TABLE "Match" DROP CONSTRAINT IF EXISTS "Match_homeTeamId_fkey";

-- Step 1: Add divisionId as nullable first
ALTER TABLE "Match" ADD COLUMN "divisionId" TEXT;

-- Step 2: Populate divisionId from group's divisionId for matches that have a groupId
UPDATE "Match" m
SET "divisionId" = g."divisionId"
FROM "Group" g
WHERE m."groupId" = g."id" AND m."groupId" IS NOT NULL;

-- Step 3: Delete matches that don't have a groupId (they can't be properly associated)
DELETE FROM "Match" WHERE "groupId" IS NULL;

-- Step 4: Now make divisionId required
ALTER TABLE "Match" ALTER COLUMN "divisionId" SET NOT NULL;

-- Step 5: Make groupId required (should be safe now since we deleted NULLs)
ALTER TABLE "Match" ALTER COLUMN "groupId" SET NOT NULL;

-- Step 6: Make homeTeamId and awayTeamId nullable (as per schema)
ALTER TABLE "Match" ALTER COLUMN "homeTeamId" DROP NOT NULL;
ALTER TABLE "Match" ALTER COLUMN "awayTeamId" DROP NOT NULL;

-- Step 7: Make startTime nullable (as per schema)
ALTER TABLE "Match" ALTER COLUMN "startTime" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
