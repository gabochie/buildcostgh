-- AlterTable: Order.metadata String? -> Json?
ALTER TABLE "Order" DROP COLUMN "metadata";
ALTER TABLE "Order" ADD COLUMN "metadata" JSONB;

-- CreateTable: ApiKey
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateTable: Job
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Job_status_scheduledAt_idx" ON "Job"("status", "scheduledAt");

-- CreateTable: AgentLog
CREATE TABLE "AgentLog" (
    "id" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "details" JSONB,
    "level" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgentLog_agent_createdAt_idx" ON "AgentLog"("agent", "createdAt");
CREATE INDEX "AgentLog_level_idx" ON "AgentLog"("level");

-- CreateTable: SeasonalFactor
CREATE TABLE "SeasonalFactor" (
    "id" TEXT NOT NULL,
    "region" TEXT,
    "month" INTEGER NOT NULL,
    "material" TEXT,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalFactor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SeasonalFactor_region_month_active_idx" ON "SeasonalFactor"("region", "month", "active");

-- CreateTable: PriceUpdate
CREATE TABLE "PriceUpdate" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "oldAmount" INTEGER NOT NULL,
    "newAmount" INTEGER NOT NULL,
    "reason" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PriceUpdate_createdAt_idx" ON "PriceUpdate"("createdAt");
