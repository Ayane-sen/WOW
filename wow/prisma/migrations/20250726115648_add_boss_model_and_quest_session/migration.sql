-- CreateTable
CREATE TABLE "bosses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "initial_hp" INTEGER NOT NULL,
    "attack_power" INTEGER NOT NULL,
    "defense_power" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "bosses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bosses_name_key" ON "bosses"("name");
