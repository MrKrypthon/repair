-- CreateEnum
CREATE TYPE "PriceChangeSource" AS ENUM ('MANUAL', 'PURCHASE_ORDER');

-- CreateTable
CREATE TABLE "InventoryPriceHistory" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "previousCost" DECIMAL(12,2) NOT NULL,
    "newCost" DECIMAL(12,2) NOT NULL,
    "previousSalePrice" DECIMAL(12,2) NOT NULL,
    "newSalePrice" DECIMAL(12,2) NOT NULL,
    "source" "PriceChangeSource" NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryPriceHistory_inventoryItemId_createdAt_idx" ON "InventoryPriceHistory"("inventoryItemId", "createdAt");

-- AddForeignKey
ALTER TABLE "InventoryPriceHistory" ADD CONSTRAINT "InventoryPriceHistory_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
