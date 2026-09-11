ALTER TABLE "ServiceOrder" ADD COLUMN "publicTrackingToken" TEXT;

UPDATE "ServiceOrder"
SET "publicTrackingToken" = md5(random()::text || clock_timestamp()::text || "id")
WHERE "publicTrackingToken" IS NULL;

ALTER TABLE "ServiceOrder" ALTER COLUMN "publicTrackingToken" SET NOT NULL;

CREATE UNIQUE INDEX "ServiceOrder_publicTrackingToken_key" ON "ServiceOrder"("publicTrackingToken");
