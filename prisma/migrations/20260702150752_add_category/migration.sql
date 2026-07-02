-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlogPost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "author" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "category" TEXT NOT NULL DEFAULT 'uncategorized',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_BlogPost" ("author", "content", "createdAt", "excerpt", "id", "imageUrl", "published", "slug", "tags", "title", "updatedAt") SELECT "author", "content", "createdAt", "excerpt", "id", "imageUrl", "published", "slug", "tags", "title", "updatedAt" FROM "BlogPost";
DROP TABLE "BlogPost";
ALTER TABLE "new_BlogPost" RENAME TO "BlogPost";
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_slug_idx" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_published_idx" ON "BlogPost"("published");
CREATE INDEX "BlogPost_category_idx" ON "BlogPost"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
