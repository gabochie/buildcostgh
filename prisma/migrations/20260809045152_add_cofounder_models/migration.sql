-- CreateTable
CREATE TABLE "CofounderGoal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "periodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CofounderGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CofounderTask" (
    "id" TEXT NOT NULL,
    "goalId" TEXT,
    "title" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "prompt" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CofounderTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CofounderTask_goalId_status_idx" ON "CofounderTask"("goalId", "status");

-- CreateIndex
CREATE INDEX "CofounderTask_agent_idx" ON "CofounderTask"("agent");
