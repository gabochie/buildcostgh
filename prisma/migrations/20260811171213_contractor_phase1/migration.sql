-- AlterTable
ALTER TABLE "Contractor" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "classificationExpiry" TIMESTAMP(3),
ADD COLUMN     "classificationNotVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "classificationSource" TEXT,
ADD COLUMN     "classificationVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "companyType" TEXT,
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "dataConfidence" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleLastChecked" TIMESTAMP(3),
ADD COLUMN     "googleMapsUrl" TEXT,
ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "googleRating" DOUBLE PRECISION,
ADD COLUMN     "googleReviewCount" INTEGER,
ADD COLUMN     "lastVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "locality" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "mrhRoadClass" TEXT,
ADD COLUMN     "mwhBuildingClass" TEXT,
ADD COLUMN     "mwhCivilClass" TEXT,
ADD COLUMN     "mwhElectricalClass" TEXT,
ADD COLUMN     "mwhPlumbingClass" TEXT,
ADD COLUMN     "nextVerificationAt" TIMESTAMP(3),
ADD COLUMN     "projectScale" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "registrationStatus" TEXT,
ADD COLUMN     "socialProfiles" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "sponsored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "whatsapp" TEXT,
ADD COLUMN     "yearEstablished" INTEGER;

-- CreateTable
CREATE TABLE "ContractorSource" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'secondary',
    "label" TEXT NOT NULL,
    "url" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastVerifiedAt" TIMESTAMP(3),
    "confidence" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "ContractorSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractorProject" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "location" TEXT,
    "year" INTEGER,
    "value" DOUBLE PRECISION,
    "description" TEXT,
    "imageUrl" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ContractorProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassificationGrade" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ClassificationGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContractorSource_contractorId_idx" ON "ContractorSource"("contractorId");

-- CreateIndex
CREATE INDEX "ContractorProject_contractorId_idx" ON "ContractorProject"("contractorId");

-- CreateIndex
CREATE INDEX "ClassificationGrade_category_idx" ON "ClassificationGrade"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ClassificationGrade_category_grade_key" ON "ClassificationGrade"("category", "grade");

-- CreateIndex
CREATE INDEX "Contractor_region_idx" ON "Contractor"("region");

-- CreateIndex
CREATE INDEX "Contractor_mwhBuildingClass_idx" ON "Contractor"("mwhBuildingClass");

-- CreateIndex
CREATE INDEX "Contractor_featured_idx" ON "Contractor"("featured");

-- AddForeignKey
ALTER TABLE "ContractorSource" ADD CONSTRAINT "ContractorSource_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractorProject" ADD CONSTRAINT "ContractorProject_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
