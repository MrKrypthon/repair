-- AlterTable
ALTER TABLE "ServiceOrder" ADD COLUMN     "probableCause" TEXT,
ADD COLUMN     "testChecklist" JSONB;
