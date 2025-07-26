-- CreateTable
CREATE TABLE "quest_sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bossId" INTEGER NOT NULL,
    "user_current_hp" INTEGER NOT NULL,
    "boss_current_hp" INTEGER NOT NULL,
    "current_problem_index" INTEGER NOT NULL DEFAULT 0,
    "questStatus" TEXT NOT NULL DEFAULT 'ongoing',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quest_sessions" ADD CONSTRAINT "quest_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quest_sessions" ADD CONSTRAINT "quest_sessions_bossId_fkey" FOREIGN KEY ("bossId") REFERENCES "bosses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
