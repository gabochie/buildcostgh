import "server-only"
import { randomBytes } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { getOpenAiClient } from "./cofounder/agent"
import { isPlatformConfigured, type SocialPlatform } from "./social"

/**
 * Social image generation + storage for content drafts.
 *
 * Images are created with the OpenAI Images API (dall-e-3, 1024x1024 b64),
 * stored under /public/content-images and served at /content-images/<file>.png.
 * Generation is opt-in: CONTENT_GENERATE_IMAGES=disabled turns it off,
 * CONTENT_GENERATE_IMAGES=enabled forces it on, and by default it only runs
 * when at least one image-first platform (Facebook/Instagram/TikTok) has
 * credentials configured — so it never spends money with no consumer.
 */

export const CONTENT_IMAGE_DIR = join(process.cwd(), "public", "content-images")
export const CONTENT_IMAGE_URL_PREFIX = "/content-images/"

const IMAGE_FIRST_PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "tiktok"]

export function imageGenerationEnabled(): boolean {
  if (!process.env.OPENAI_API_KEY) return false
  const flag = process.env.CONTENT_GENERATE_IMAGES
  if (flag === "disabled") return false
  if (flag === "enabled") return true
  return IMAGE_FIRST_PLATFORMS.some((p) => isPlatformConfigured(p))
}

export async function generatePostImage(
  prompt: string,
  options?: { size?: "1024x1024" | "1792x1024" | "1024x1792" }
): Promise<{ imageUrl: string; prompt: string }> {
  const openai = getOpenAiClient()
  const res = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: options?.size ?? "1024x1024",
    response_format: "b64_json",
  })

  const b64 = res.data?.[0]?.b64_json
  if (!b64) throw new Error("OpenAI returned no image data")

  const fileName = `${Date.now()}-${randomBytes(4).toString("hex")}.png`
  await mkdir(CONTENT_IMAGE_DIR, { recursive: true })
  await writeFile(join(CONTENT_IMAGE_DIR, fileName), Buffer.from(b64, "base64"))

  return { imageUrl: `${CONTENT_IMAGE_URL_PREFIX}${fileName}`, prompt }
}