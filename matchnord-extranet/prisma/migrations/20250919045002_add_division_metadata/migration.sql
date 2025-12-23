/*
  Warnings:

  - You are about to drop the column `stageId` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the `Stage` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `divisionId` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_stageId_fkey";

-- DropForeignKey
ALTER TABLE "Stage" DROP CONSTRAINT "Stage_divisionId_fkey";

-- AlterTable
ALTER TABLE "Division" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "stageId",
ADD COLUMN     "divisionId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Stage";

-- DropEnum
DROP TYPE "StageType";

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE CASCADE ON UPDATE CASCADE;
