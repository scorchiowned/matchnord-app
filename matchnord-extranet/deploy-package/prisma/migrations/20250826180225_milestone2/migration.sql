/*
  Warnings:

  - Made the column `slug` on table `Organization` required. This step will fail if there are existing NULL values in that column.
  - Made the column `managerId` on table `Registration` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdById` on table `Tournament` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `Tournament` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "Registration" ALTER COLUMN "managerId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "slug" SET NOT NULL;
