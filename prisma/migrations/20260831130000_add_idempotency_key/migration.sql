-- Add an idempotency key to prevented duplicate order/subscription creation
-- when a client retries a checkout request (e.g. network retry or double-click).
-- The unique constraint makes creation idempotent at the database level.

ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Order" ADD CONSTRAINT "Order_idempotencyKey_key" UNIQUE ("idempotencyKey");

ALTER TABLE "Subscription" ADD COLUMN "idempotencyKey" TEXT;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_idempotencyKey_key" UNIQUE ("idempotencyKey");
