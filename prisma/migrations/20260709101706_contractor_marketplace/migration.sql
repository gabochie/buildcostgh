-- CreateTable: Contractor
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "website" TEXT,
    "description" TEXT NOT NULL,
    "specialties" JSONB NOT NULL DEFAULT '[]',
    "yearsOfExperience" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "insurance" TEXT,
    "licenseInfo" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "portfolioImages" JSONB NOT NULL DEFAULT '[]',
    "logo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Contractor_slug_key" ON "Contractor"("slug");
CREATE INDEX "Contractor_status_verified_idx" ON "Contractor"("status", "verified");
CREATE INDEX "Contractor_slug_idx" ON "Contractor"("slug");

-- CreateTable: ContractorRegion
CREATE TABLE "ContractorRegion" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    CONSTRAINT "ContractorRegion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ContractorRegion_contractorId_regionId_key" ON "ContractorRegion"("contractorId", "regionId");

-- AddForeignKey
ALTER TABLE "ContractorRegion" ADD CONSTRAINT "ContractorRegion_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorRegion" ADD CONSTRAINT "ContractorRegion_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;
