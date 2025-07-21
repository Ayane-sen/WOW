-- CreateTable
CREATE TABLE "word" (
    "id" BIGSERIAL NOT NULL,
    "word" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,

    CONSTRAINT "word_pkey" PRIMARY KEY ("id")
);
