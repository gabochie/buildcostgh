-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentGateway" TEXT,
ADD COLUMN     "gatewayRef" TEXT;

-- CreateIndex
CREATE INDEX "Order_paymentGateway_idx" ON "Order"("paymentGateway");

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "paymentGateway" TEXT,
ADD COLUMN     "gatewayRef" TEXT;
