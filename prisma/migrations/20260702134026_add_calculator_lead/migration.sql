-- CreateTable
CREATE TABLE "CalculatorLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "bedrooms" TEXT,
    "location" TEXT,
    "floorArea" TEXT,
    "floors" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
