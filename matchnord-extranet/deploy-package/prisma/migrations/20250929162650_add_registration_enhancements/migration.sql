/*
  Warnings:

  - Added the required column `contactFirstName` to the `Registration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactLastName` to the `Registration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "contactAddress" TEXT,
ADD COLUMN     "contactCity" TEXT,
ADD COLUMN     "contactFirstName" TEXT NOT NULL,
ADD COLUMN     "contactLastName" TEXT NOT NULL,
ADD COLUMN     "contactPostalCode" TEXT;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "registrationInfo" TEXT;
