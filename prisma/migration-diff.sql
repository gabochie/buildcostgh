-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "expresspayToken" TEXT,
ADD COLUMN     "reference" TEXT NOT NULL,
ADD COLUMN     "transactionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_reference_key" ON "Subscription"("reference");

-- CreateIndex
CREATE INDEX "Subscription_reference_idx" ON "Subscription"("reference");
