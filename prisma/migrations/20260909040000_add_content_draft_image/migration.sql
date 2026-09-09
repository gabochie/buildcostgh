-- Add imageUrl to ContentDraft so rendered social graphics can be stored
-- per draft (batched image generation + media post publishing).

ALTER TABLE "ContentDraft" ADD COLUMN "imageUrl" TEXT;