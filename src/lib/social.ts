import "server-only"
import { prisma } from "./prisma"
import { logAgentAction } from "./agent-log"

/**
 * Social publishing for approved content drafts.
 *
 * Only platforms with credentials configured are published automatically.
 * Instagram and TikTok remain manual for now (the Graph/TikTok APIs require
 * image/reel media, which the engine does not generate yet). Every publish
 * attempt is recorded as a SocialPost row so the admin queue stays auditable.
 */

export type SocialPlatform = "facebook" | "instagram" | "x" | "linkedin" | "tiktok"

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["facebook", "instagram", "x", "linkedin", "tiktok"]

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X (Twitter)",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
}

export function isPlatformConfigured(platform: SocialPlatform): boolean {
  switch (platform) {
    case "facebook":
      return !!(process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID)
    case "x":
      return !!process.env.X_BEARER_TOKEN
    case "linkedin":
      return !!(process.env.LINKEDIN_ACCESS_TOKEN && process.env.LINKEDIN_URN)
    case "instagram":
    case "tiktok":
      return false // requires image/reel media — manual for now
  }
}

export function getConfiguredPlatforms(): SocialPlatform[] {
  return SOCIAL_PLATFORMS.filter(isPlatformConfigured)
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + "…"
}

type PublishResult = {
  ok: boolean
  manual?: boolean
  externalUrl?: string
  error?: string
}

async function publishFacebook(message: string): Promise<PublishResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID
  const token = process.env.FACEBOOK_ACCESS_TOKEN
  if (!pageId || !token) return { ok: false, error: "FACEBOOK_ACCESS_TOKEN / FACEBOOK_PAGE_ID not configured" }

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: token }),
  })
  const data = (await res.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null
  if (!res.ok || !data?.id) {
    return { ok: false, error: data?.error?.message ?? `Facebook returned ${res.status}` }
  }
  const postId = data.id.split("_")[1] ?? data.id
  return { ok: true, externalUrl: `https://www.facebook.com/${pageId}/posts/${postId}` }
}

async function publishX(text: string): Promise<PublishResult> {
  const token = process.env.X_BEARER_TOKEN
  if (!token) return { ok: false, error: "X_BEARER_TOKEN not configured" }

  const res = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: truncate(text, 280) }),
  })
  const data = (await res.json().catch(() => null)) as { data?: { id?: string }; errors?: { message?: string }[] } | null
  if (!res.ok || !data?.data?.id) {
    return { ok: false, error: data?.errors?.map((e) => e.message).join("; ") ?? `X returned ${res.status}` }
  }
  return { ok: true, externalUrl: `https://x.com/i/status/${data.data.id}` }
}

async function publishLinkedIn(text: string): Promise<PublishResult> {
  const token = process.env.LINKEDIN_ACCESS_TOKEN
  const urn = process.env.LINKEDIN_URN
  if (!token || !urn) return { ok: false, error: "LINKEDIN_ACCESS_TOKEN / LINKEDIN_URN not configured" }

  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0" },
    body: JSON.stringify({
      author: `urn:li:person:${urn}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: truncate(text, 3000) },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { message?: string } | null
    return { ok: false, error: data?.message ?? `LinkedIn returned ${res.status}` }
  }
  const restId = res.headers.get("x-restli-id") ?? ""
  const shareId = restId.split(":").pop() ?? ""
  return { ok: true, externalUrl: shareId ? `https://www.linkedin.com/feed/update/${restId}` : restId }
}

/**
 * Publish an approved ContentDraft to every target platform that has
 * credentials. Records a SocialPost row per platform and updates the draft
 * status when at least one platform succeeds.
 */
export async function publishContentDraft(draftId: string): Promise<{ published: number; posts: { id: string; platform: string; status: string; externalUrl?: string | null }[] }> {
  const draft = await prisma.contentDraft.findUnique({ where: { id: draftId } })
  if (!draft) throw new Error(`Content draft ${draftId} not found`)
  if (draft.status !== "approved") {
    throw new Error(`Only approved drafts can be published (current status: ${draft.status})`)
  }

  const draftPlatforms = (draft.platforms ?? []) as SocialPlatform[]
  const configured = getConfiguredPlatforms()
  const targets = draftPlatforms.length
    ? draftPlatforms.filter((p) => isPlatformConfigured(p))
    : configured

  if (targets.length === 0) {
    const note = "No social credentials configured. Connect Facebook/X/LinkedIn keys or post manually."
    throw new Error(note)
  }

  const manualTargets = draftPlatforms.filter((p) => !isPlatformConfigured(p) && p !== "x" && p !== "facebook" && p !== "linkedin")

  const text = draft.body ? `${draft.caption}\n\n${draft.body}` : draft.caption
  const offer = (draft.offer ?? {}) as Record<string, unknown>
  const offerLine = offer.headline ? `\n\n${String(offer.headline)} — ${String(offer.detail ?? "")} (${String(offer.cta ?? "")})` : ""

  const posts: { id: string; platform: string; status: string; externalUrl?: string | null }[] = []
  let published = 0

  for (const platform of manualTargets) {
    const post = await prisma.socialPost.create({
      data: {
        draftId: draft.id,
        platform,
        status: "manual",
        error: "Manual post required (no automatic publishing for this platform yet)",
      },
      select: { id: true, platform: true, status: true, externalUrl: true },
    })
    posts.push(post)
    await logAgentAction({
      agent: "ContentBot",
      action: "social_post_manual",
      entityType: "social_post",
      entityId: post.id,
      level: "info",
      details: { platform, draftId: draft.id },
    })
  }

  for (const platform of targets) {
    const result =
      platform === "facebook" ? await publishFacebook(`${text}${offerLine}`) :
      platform === "x" ? await publishX(`${truncate(text, 230)}${offerLine ? truncate(`\n\n${offerLine}`, 50) : ""}`) :
      await publishLinkedIn(`${text}${offerLine}`)

    const post = await prisma.socialPost.create({
      data: {
        draftId: draft.id,
        platform,
        status: result.ok ? "published" : "failed",
        externalUrl: result.externalUrl,
        error: result.error,
        publishedAt: result.ok ? new Date() : undefined,
      },
      select: { id: true, platform: true, status: true, externalUrl: true },
    })
    posts.push(post)

    if (result.ok) {
      published++
      await logAgentAction({
        agent: "ContentBot",
        action: "social_post_published",
        entityType: "social_post",
        entityId: post.id,
        level: "success",
        details: { platform, externalUrl: result.externalUrl },
      })
    } else {
      await logAgentAction({
        agent: "ContentBot",
        action: "social_post_failed",
        entityType: "social_post",
        entityId: post.id,
        level: "error",
        details: { platform, error: result.error },
      })
    }
  }

  await prisma.contentDraft.update({
    where: { id: draft.id },
    data: { status: published > 0 ? "published" : "approved", publishedAt: published > 0 ? new Date() : undefined },
  })

  if (published === 0) {
    throw new Error(`No platforms published (${posts.filter((p) => p.status === "failed").length} failed)`)
  }

  return { published, posts }
}
