-- CreateTable
CREATE TABLE "PermitRequirement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "required" TEXT NOT NULL DEFAULT 'required',
    "appliesTo" JSONB NOT NULL,
    "authority" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermitRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authority" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "district" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "permitProcess" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Authority_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PermitRequirement_category_idx" ON "PermitRequirement"("category");

-- CreateIndex
CREATE INDEX "PermitRequirement_required_idx" ON "PermitRequirement"("required");

-- CreateIndex
CREATE INDEX "PermitRequirement_isActive_idx" ON "PermitRequirement"("isActive");

-- CreateIndex
CREATE INDEX "Authority_region_idx" ON "Authority"("region");

-- CreateIndex
CREATE INDEX "Authority_type_idx" ON "Authority"("type");

-- CreateIndex
CREATE INDEX "Authority_isActive_idx" ON "Authority"("isActive");
