-- CreateEnum
CREATE TYPE "TechnicalDocumentCategory" AS ENUM ('SOLUTION', 'MEASUREMENT', 'DIAGRAM', 'DATASHEET', 'PROCEDURE', 'KNOWN_ERROR');

-- CreateTable
CREATE TABLE "TechnicalDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "TechnicalDocumentCategory" NOT NULL,
    "deviceBrand" TEXT,
    "deviceModel" TEXT,
    "description" TEXT NOT NULL,
    "keywords" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechnicalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalNote" (
    "id" TEXT NOT NULL,
    "technicalDocumentId" TEXT,
    "serviceOrderId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "measurements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TechnicalNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TechnicalDocument_deviceBrand_deviceModel_idx" ON "TechnicalDocument"("deviceBrand", "deviceModel");

-- CreateIndex
CREATE INDEX "TechnicalDocument_category_idx" ON "TechnicalDocument"("category");

-- AddForeignKey
ALTER TABLE "TechnicalNote" ADD CONSTRAINT "TechnicalNote_technicalDocumentId_fkey" FOREIGN KEY ("technicalDocumentId") REFERENCES "TechnicalDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalNote" ADD CONSTRAINT "TechnicalNote_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "ServiceOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
