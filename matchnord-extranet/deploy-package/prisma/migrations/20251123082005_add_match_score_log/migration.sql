-- CreateTable
CREATE TABLE "MatchScoreLog" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "homeScore" INTEGER NOT NULL,
    "awayScore" INTEGER NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchScoreLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchScoreLog_matchId_idx" ON "MatchScoreLog"("matchId");

-- AddForeignKey
ALTER TABLE "MatchScoreLog" ADD CONSTRAINT "MatchScoreLog_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchScoreLog" ADD CONSTRAINT "MatchScoreLog_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
