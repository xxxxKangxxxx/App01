-- CreateEnum
CREATE TYPE "Category" AS ENUM ('VEGETABLES', 'FRUITS', 'MEAT', 'SEAFOOD', 'DAIRY', 'BEVERAGE', 'CONDIMENT', 'FROZEN', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "kakaoId" TEXT,
    "naverId" TEXT,
    "googleId" TEXT,
    "pushToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT '개',
    "purchasedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "location" TEXT,
    "memo" TEXT,
    "isConsumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "FoodItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoId_key" ON "User"("kakaoId");

-- CreateIndex
CREATE UNIQUE INDEX "User_naverId_key" ON "User"("naverId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "FoodItem_userId_idx" ON "FoodItem"("userId");

-- CreateIndex
CREATE INDEX "FoodItem_expiresAt_idx" ON "FoodItem"("expiresAt");

-- CreateIndex
CREATE INDEX "FoodItem_isConsumed_idx" ON "FoodItem"("isConsumed");

-- AddForeignKey
ALTER TABLE "FoodItem" ADD CONSTRAINT "FoodItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
