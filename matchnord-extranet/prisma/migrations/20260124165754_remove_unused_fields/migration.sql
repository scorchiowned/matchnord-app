-- AlterTable
-- Remove unused fields identified in schema audit

-- Remove User.approvedBy (never populated in production code)
ALTER TABLE "User" DROP COLUMN IF EXISTS "approvedBy";

-- Remove Tournament.publishedAt (redundant with status field)
ALTER TABLE "Tournament" DROP COLUMN IF EXISTS "publishedAt";

-- Remove Match.scheduledBy (set but never queried)
ALTER TABLE "Match" DROP COLUMN IF EXISTS "scheduledBy";

-- Remove Payment.providerData (payment provider metadata never used)
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "providerData";

-- Remove TournamentAssignment.permissions (granular permissions never implemented)
ALTER TABLE "TournamentAssignment" DROP COLUMN IF EXISTS "permissions";

-- Remove TournamentAssignment.expiresAt (expiration never checked)
ALTER TABLE "TournamentAssignment" DROP COLUMN IF EXISTS "expiresAt";
