-- CreateEnum
CREATE TYPE "GachaRarity" AS ENUM ('COMMON', 'RARE', 'SUPER_RARE', 'ULTRA_RARE');

-- CreateTable
CREATE TABLE "gacha_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" INTEGER NOT NULL,
    "type" TEXT,

    CONSTRAINT "gacha_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_items" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isEquipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "gachaItemId" INTEGER NOT NULL,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gacha_history" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "gachaItemId" INTEGER NOT NULL,

    CONSTRAINT "gacha_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_gachaItemId_fkey" FOREIGN KEY ("gachaItemId") REFERENCES "gacha_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gacha_history" ADD CONSTRAINT "gacha_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gacha_history" ADD CONSTRAINT "gacha_history_gachaItemId_fkey" FOREIGN KEY ("gachaItemId") REFERENCES "gacha_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
