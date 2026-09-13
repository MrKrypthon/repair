-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "warrantyDays" INTEGER,
ADD COLUMN     "warrantyExpiresAt" TIMESTAMP(3),
ADD COLUMN     "warrantyForOrderId" TEXT;

-- CreateIndex
CREATE INDEX "ServiceOrder_warrantyForOrderId_idx" ON "ServiceOrder"("warrantyForOrderId");

-- AddForeignKey
ALTER TABLE "ServiceOrder" ADD CONSTRAINT "ServiceOrder_warrantyForOrderId_fkey" FOREIGN KEY ("warrantyForOrderId") REFERENCES "ServiceOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
