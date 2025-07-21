/*
  Warnings:

  - The primary key for the `word` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `word` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "word" DROP CONSTRAINT "word_pkey",
ALTER COLUMN "id" SET DATA TYPE SERIAL,
ADD CONSTRAINT "word_pkey" PRIMARY KEY ("id");
