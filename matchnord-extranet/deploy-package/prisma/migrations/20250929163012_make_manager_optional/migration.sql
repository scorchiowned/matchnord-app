-- DropForeignKey
ALTER TABLE "Registration" DROP CONSTRAINT "Registration_managerId_fkey";

-- AlterTable
ALTER TABLE "Registration" ALTER COLUMN "managerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
