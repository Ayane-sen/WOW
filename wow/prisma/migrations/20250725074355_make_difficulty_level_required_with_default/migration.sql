/*
  Warnings:

  - Made the column `difficultyLevel` on table `words` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "words" ALTER COLUMN "difficultyLevel" SET NOT NULL,
ALTER COLUMN "difficultyLevel" SET DEFAULT 1;
