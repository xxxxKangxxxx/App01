-- CreateEnum
CREATE TYPE "StorageMethod" AS ENUM ('REFRIGERATED', 'FROZEN', 'ROOM_TEMP');

-- CreateTable
CREATE TABLE "FoodShelfLife" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "defaultDays" INTEGER NOT NULL,
    "storageMethod" "StorageMethod" NOT NULL DEFAULT 'REFRIGERATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodShelfLife_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FoodShelfLife_category_idx" ON "FoodShelfLife"("category");

-- CreateIndex
CREATE INDEX "FoodShelfLife_name_idx" ON "FoodShelfLife"("name");

-- CreateIndex
CREATE UNIQUE INDEX "FoodShelfLife_name_storageMethod_key" ON "FoodShelfLife"("name", "storageMethod");
