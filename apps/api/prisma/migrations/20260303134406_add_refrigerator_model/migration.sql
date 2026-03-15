-- CreateEnum
CREATE TYPE "RefrigeratorType" AS ENUM ('STANDARD', 'SIDE_BY_SIDE', 'FRENCH_DOOR', 'FREEZER', 'KIMCHI');

-- AlterTable
ALTER TABLE "FoodItem" ADD COLUMN     "colPosition" TEXT,
ADD COLUMN     "depth" TEXT,
ADD COLUMN     "refrigeratorId" TEXT,
ADD COLUMN     "shelf" INTEGER,
ADD COLUMN     "zone" TEXT;

-- CreateTable
CREATE TABLE "Refrigerator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "RefrigeratorType" NOT NULL DEFAULT 'STANDARD',
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Refrigerator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Refrigerator_userId_idx" ON "Refrigerator"("userId");

-- CreateIndex
CREATE INDEX "FoodItem_refrigeratorId_idx" ON "FoodItem"("refrigeratorId");

-- CreateIndex
CREATE INDEX "FoodItem_refrigeratorId_zone_idx" ON "FoodItem"("refrigeratorId", "zone");

-- AddForeignKey
ALTER TABLE "Refrigerator" ADD CONSTRAINT "Refrigerator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_refrigeratorId_fkey" FOREIGN KEY ("refrigeratorId") REFERENCES "Refrigerator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
