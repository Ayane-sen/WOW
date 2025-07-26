-- AlterTable
ALTER TABLE "user_characters" ADD COLUMN     "level_status_id" INTEGER;

-- AddForeignKey
ALTER TABLE "user_characters" ADD CONSTRAINT "user_characters_level_status_id_fkey" FOREIGN KEY ("level_status_id") REFERENCES "level_statuses"("level") ON DELETE SET NULL ON UPDATE CASCADE;
