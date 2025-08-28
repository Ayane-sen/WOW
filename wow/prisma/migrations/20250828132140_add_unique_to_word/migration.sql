/*
  Warnings:

  - A unique constraint covering the columns `[user_id,word,meaning]` on the table `words` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "words_user_id_word_meaning_key" ON "words"("user_id", "word", "meaning");
