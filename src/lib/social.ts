import "server-only"
import { prisma } from "./prisma"
import { logAgentAction } from "./agent-log"
import { CONTENT_AGENT } from "./agent-constants"

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
      // Google-photo publishing for Instagram via the Instagram Graph API when
      // an Instagram business account is linked to the Facebook page.
      return !!(process.env.FACEBOOK_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID)
    case "tiktok":
      return false // requires video upload — manual for now
  }
}

export function getConfiguredPlatforms(): SocialPlatform[] {
  return SOCIAL_PLATFORMS.filter(isPlatformConfigured)
}

/**
 * Extract the plan date from a draft source string of the form
 * `content-plan:2026-09-14:cost-guides:0`. Used to stamp the scheduled publish
 * date on SocialPost rows so the batch is auditable and timely.
 */
export function planDateForSource(source: string | null): Date | null {
  if (!source || !source.startsWith("content-plan:")) return null
  const match = /^content-plan:(\d{4}-\d{2}-\d{2}):/.exec(source)
  if (!match) return null
  const d = new Date(`${match[1]}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
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

async function publishFacebook(message: string, imageUrl?: string | null): Promise<PublishResult> {
  const pageId = process.env.FACEBOOK_PAGE_ID
  const token = process.env.FACEBOOK_ACCESS_TOKEN
  if (!pageId || !token) return { ok: false, error: "FACEBOOK_ACCESS_TOKEN / FACEBOOK_PAGE_ID not configured" }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
  const headers = { "Content-Type": "application/json" }

  // Text-only or photo post. Photos use the public image URL (Graph API fetches it).
  if (imageUrl) {
    const absoluteImage = imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`
    const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
      method: "POST",
      headers,
      body: JSON.stringify({ url: absoluteImage, message, access_token: token }),
    })
    const data = (await res.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null
    if (!res.ok || !data?.id) {
      return { ok: false, error: data?.error?.message ?? `Facebook returned ${res.status}` }
    }
    const postId = data.id.split("_")[1] ?? data.id
    return { ok: true, externalUrl: `https://www.facebook.com/${pageId}/posts/${postId}` }
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: "POST",
    headers,
    body: JSON.stringify({ message, access_token: token }),
  })
  const data = (await res.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null
  if (!res.ok || !data?.id) {
    return { ok: false, error: data?.error?.message ?? `Facebook returned ${res.status}` }
  }
  const postId = data.id.split("_")[1] ?? data.id
  return { ok: true, externalUrl: `https://www.facebook.com/${pageId}/posts/${postId}` }
}

async function publishInstagram(caption: string, imageUrl: string): Promise<PublishResult> {
  const token = process.env.FACEBOOK_ACCESS_TOKEN
  const igAccount = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  if (!token || !igAccount) return { ok: false, error: "FACEBOOK_ACCESS_TOKEN / INSTAGRAM_BUSINESS_ACCOUNT_ID not configured" }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
  const absoluteImage = imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`
  const headers = { "Content-Type": "application/json" }

  // 1) Create the image media container.
  const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igAccount}/media`, {
    method: "POST",
    headers,
    body: JSON.stringify({ image_url: absoluteImage, caption, access_token: token }),
  })
  const container = (await containerRes.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null
  if (!containerRes.ok || !container?.id) {
    return { ok: false, error: container?.error?.message ?? `Instagram container creation returned ${containerRes.status}` }
  }

  // 2) Publish the container.
  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccount}/media_publish`, {
    method: "POST",
    headers,
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  })
  const published = (await publishRes.json().catch(() => null)) as { id?: string; error?: { message?: string } } | null
  if (!publishRes.ok || !published?.id) {
    return { ok: false, error: published?.error?.message ?? `Instagram publish returned ${publishRes.status}` }
  }
  return { ok: true, externalUrl: `https://www.instagram.com/p/${published.id}/` }
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

  // Batch partition: any platform with credentials AND (for image-first
  // platforms) a ready image can be posted automatically; everything else is
  // recorded as a manual task in the same batch.
  const autoTargets = draftPlatforms.filter((p) => {
    if (!isPlatformConfigured(p)) return false
    if (p === "instagram") return !!draft.imageUrl
    return true
  })
  const manualTargets = draftPlatforms.filter((p) => !autoTargets.includes(p))

  const targets = autoTargets.length ? autoTargets : configured.filter((p) => p !== "instagram" || !!draft.imageUrl)

  if (targets.length === 0 && manualTargets.length > 0) {
    throw new Error("No platforms can be auto-published (connect Facebook/X/LinkedIn keys, or Instagram with an image, or post manually).")
  }

  const text = draft.body ? `${draft.caption}\n\n${draft.body}` : draft.caption
  const offer = (draft.offer ?? {}) as Record<string, unknown>
  const offerLine = offer.headline ? `\n\n${String(offer.headline)} — ${String(offer.detail ?? "")} (${String(offer.cta ?? "")})` : ""
  const finalText = `${text}${offerLine}`
  const scheduledAt = planDateForSource(draft.source)

  const posts: { id: string; platform: string; status: string; externalUrl?: string | null }[] = []
  let published = 0

  for (const platform of manualTargets) {
    const reason =
      platform === "instagram" && !draft.imageUrl
        ? "Manual post required (Instagram needs an image; generate one in the batch first)"
        : "Manual post required (no automatic publishing for this platform yet)"
    const post = await prisma.socialPost.create({
      data: { draftId: draft.id, platform, status: "manual", error: reason, scheduledAt },
      select: { id: true, platform: true, status: true, externalUrl: true },
    })
    posts.push(post)
    await logAgentAction({
      agent: CONTENT_AGENT,
      action: "social_post_manual",
      entityType: "social_post",
      entityId: post.id,
      level: "info",
      details: { platform, draftId: draft.id },
    })
  }

  for (const platform of targets) {
    const result =
      platform === "facebook" ? await publishFacebook(finalText, draft.imageUrl) :
      platform === "x" ? await publishX(`${truncate(`\n\n${text}`, 230)}${offerLine ? truncate(`\n\n${offerLine}`, 50) : ""}`) :
      platform === "instagram" ? await publishInstagram(finalText, draft.imageUrl!) :
      await publishLinkedIn(finalText)

    const post = await prisma.socialPost.create({
      data: {
        draftId: draft.id,
        platform,
        status: result.ok ? "published" : "failed",
        externalUrl: result.externalUrl,
        error: result.error,
        scheduledAt,
        publishedAt: result.ok ? new Date() : undefined,
      },
      select: { id: true, platform: true, status: true, externalUrl: true },
    })
    posts.push(post)

    if (result.ok) {
      published++
      await logAgentAction({
        agent: CONTENT_AGENT,
        action: "social_post_published",
        entityType: "social_post",
        entityId: post.id,
        level: "success",
        details: { platform, externalUrl: result.externalUrl },
      })
    } else {
      await logAgentAction({
        agent: CONTENT_AGENT,
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

/**
 * Batch publishing: publish every approved-but-unpublished ContentDraft in one
 * call. Each draft goes through `publishContentDraft`, so results are recorded
 * per platform and per draft in the admin queue. Idempotent for already
 * published drafts (they are filtered out up front).
 */
export async function publishAllApproved(
  options?: { limit?: number; draftIds?: string[] }
): Promise<{
  published: number
  failed: number
  results: { draftId: string; title: string; published: number; error?: string }[]
}> {
  const where = options?.draftIds?.length
    ? { id: { in: options.draftIds }, status: "approved" as const }
    : { status: "approved" as const }

  const drafts = await prisma.contentDraft.findMany({
    where,
    orderBy: { createdAt: "asc" as const },
    select: { id: true, title: true },
    take: options?.limit ?? 50,
  })

  const results: { draftId: string; title: string; published: number; error?: string }[] = []
  let published = 0
  let failed = 0

  for (const draft of drafts) {
    try {
      const res = await publishContentDraft(draft.id)
      published += res.published
      results.push({ draftId: draft.id, title: draft.title, published: res.published })
    } catch (err) {
      failed++
      results.push({ draftId: draft.id, title: draft.title, published: 0, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return { published, failed, results }
}
