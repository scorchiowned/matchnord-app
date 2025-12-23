/*
  Warnings:

  - You are about to drop the column `registrationId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the `Registration` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITLISTED');

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_registrationId_fkey";

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_divisionId_fkey";

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_managerId_fkey";

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_teamId_fkey";

-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_tournamentId_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "registrationId",
ADD COLUMN     "teamId" TEXT;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingCity" TEXT,
ADD COLUMN     "billingEmail" TEXT,
ADD COLUMN     "billingName" TEXT,
ADD COLUMN     "billingPostalCode" TEXT,
ADD COLUMN     "contactAddress" TEXT,
ADD COLUMN     "contactCity" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactFirstName" TEXT,
ADD COLUMN     "contactLastName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "contactPostalCode" TEXT,
ADD COLUMN     "divisionId" TEXT,
ADD COLUMN     "isWaitlisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "status" "TeamStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "Registration";

-- DropEnum
DROP TYPE "RegistrationStatus";

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
