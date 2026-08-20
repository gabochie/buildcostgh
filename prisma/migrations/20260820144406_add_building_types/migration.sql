-- CreateTable
CREATE TABLE "BuildingCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingSubtype" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "complexity" TEXT NOT NULL DEFAULT 'standard',
    "typicalMinFloors" INTEGER NOT NULL DEFAULT 1,
    "typicalMaxFloors" INTEGER NOT NULL DEFAULT 5,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuildingSubtype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostProfile" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subtypeId" TEXT,
    "qualityLevel" TEXT NOT NULL,
    "baseCostPerSqm" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "substructurePct" DECIMAL(65,30) NOT NULL DEFAULT 0.12,
    "framePct" DECIMAL(65,30) NOT NULL DEFAULT 0.18,
    "upperFloorsPct" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
    "roofPct" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
    "externalWallsPct" DECIMAL(65,30) NOT NULL DEFAULT 0.08,
    "windowsDoorsPct" DECIMAL(65,30) NOT NULL DEFAULT 0.07,
    "internalFinishesPct" DECIMAL(65,30) NOT NULL DEFAULT 0.15,
    "externalFinishesPct" DECIMAL(65,30) NOT NULL DEFAULT 0.04,
    "fittingsPct" DECIMAL(65,30) NOT NULL DEFAULT 0.03,
    "mechanicalPct" DECIMAL(65,30) NOT NULL DEFAULT 0.05,
    "electricalPct" DECIMAL(65,30) NOT NULL DEFAULT 0.05,
    "fireProtectionPct" DECIMAL(65,30) NOT NULL DEFAULT 0.01,
    "externalWorksPct" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
    "siteDevelopmentPct" DECIMAL(65,30) NOT NULL DEFAULT 0.05,
    "architectFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.08,
    "qsFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.04,
    "structuralEngFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.04,
    "civilEngFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.02,
    "mechanicalEngFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.02,
    "electricalEngFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.02,
    "geotechFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.01,
    "pmFeePct" DECIMAL(65,30) NOT NULL DEFAULT 0.03,
    "contingencyPct" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
    "escalationPct" DECIMAL(65,30) NOT NULL DEFAULT 0.05,
    "rangeFactor" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "confidenceLevel" TEXT NOT NULL DEFAULT 'medium',
    "source" TEXT,
    "lastReviewed" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BuildingCategory_name_key" ON "BuildingCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingCategory_slug_key" ON "BuildingCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "BuildingSubtype_slug_key" ON "BuildingSubtype"("slug");

-- CreateIndex
CREATE INDEX "BuildingSubtype_categoryId_idx" ON "BuildingSubtype"("categoryId");

-- CreateIndex
CREATE INDEX "CostProfile_categoryId_idx" ON "CostProfile"("categoryId");

-- CreateIndex
CREATE INDEX "CostProfile_qualityLevel_idx" ON "CostProfile"("qualityLevel");

-- CreateIndex
CREATE UNIQUE INDEX "CostProfile_categoryId_subtypeId_qualityLevel_key" ON "CostProfile"("categoryId", "subtypeId", "qualityLevel");

-- AddForeignKey
ALTER TABLE "BuildingSubtype" ADD CONSTRAINT "BuildingSubtype_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BuildingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostProfile" ADD CONSTRAINT "CostProfile_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BuildingCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostProfile" ADD CONSTRAINT "CostProfile_subtypeId_fkey" FOREIGN KEY ("subtypeId") REFERENCES "BuildingSubtype"("id") ON DELETE SET NULL ON UPDATE CASCADE;
