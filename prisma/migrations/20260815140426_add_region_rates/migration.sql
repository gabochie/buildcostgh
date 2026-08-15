-- CreateTable
CREATE TABLE "RegionRate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "capital" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "labourRate" INTEGER NOT NULL DEFAULT 0,
    "cementBag" INTEGER NOT NULL DEFAULT 0,
    "rebarTon" INTEGER NOT NULL DEFAULT 0,
    "block" INTEGER NOT NULL DEFAULT 0,
    "sandTrip" INTEGER NOT NULL DEFAULT 0,
    "graniteTrip" INTEGER NOT NULL DEFAULT 0,
    "timber" INTEGER NOT NULL DEFAULT 0,
    "roofingSqm" INTEGER NOT NULL DEFAULT 0,
    "dieselLit" INTEGER NOT NULL DEFAULT 0,
    "paintLit" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "notes" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegionRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegionRate_name_key" ON "RegionRate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RegionRate_slug_key" ON "RegionRate"("slug");

-- CreateIndex
CREATE INDEX "RegionRate_published_idx" ON "RegionRate"("published");

-- CreateIndex
CREATE INDEX "RegionRate_multiplier_idx" ON "RegionRate"("multiplier");
