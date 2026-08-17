-- AlterTable: Add new columns to BlogPost
ALTER TABLE "BlogPost" ADD COLUMN "authorBio" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN "faqJson" TEXT DEFAULT '[]';
ALTER TABLE "BlogPost" ADD COLUMN "schemaType" TEXT NOT NULL DEFAULT 'Article';
ALTER TABLE "BlogPost" ADD COLUMN "readTimeMin" INTEGER;
