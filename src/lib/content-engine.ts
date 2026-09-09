import "server-only"
import { prisma } from "./prisma"
import { runSubagent } from "./cofounder/agent"
import { getSubagent } from "./cofounder/subagents"
import { logAgentAction } from "./agent-log"
import { getConfiguredPlatforms, type SocialPlatform } from "./social"
import { CONTENT_AGENT } from "./agent-constants"
import { generatePostImage, imageGenerationEnabled } from "./media"

export { CONTENT_AGENT }

import type { PlannedSlot } from "./content-plan"
import type { DraftKind } from "./content-plan"

/**
 * Content Marketing Engine.
 *
 * The Content agent runs autonomously on a schedule (cron → /api/content/scheduled),
 * gathers real business context (rates, blog, orders, leads, pricing), and drafts a
 * themed post + an irresistible offer. Drafts are NEVER published automatically —
 * they land in the admin Content Marketing queue for founder approval, honoring the
 * cofounder's "everything external requires founder approval" rule.
 *
 * When a `slot` from the 1-year Content Plan is provided, the draft is generated
 * for that exact slot (pillar, topic, keyword, offer, platforms) and stored with a
 * `content-plan:<dateKey>:<pillar>:<index>` source for dedupe/rotation.
 */

type DraftOffer = {
  headline: string
  detail: string
  expiresInDays: number
  cta: string
}

type DraftOutput = {
  kind: "social" | "blog"
  title: string
  caption: string
  body: string | null
  offer: DraftOffer
  platforms: SocialPlatform[]
  imagePrompt?: string
  tags?: string[]
  category?: string
}

function stripQuotes(value: string): string {
  const v = value.trim()
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1)
  }
  return v
}

function toDraftOutput(record: Record<string, unknown>): DraftOutput {
  const offer = (record.offer ?? {}) as Record<string, unknown>
  const platforms = Array.isArray(record.platforms) ? record.platforms.filter((p): p is SocialPlatform => typeof p === "string") : []
  const tags = Array.isArray(record.tags) ? record.tags.filter((t): t is string => typeof t === "string").slice(0, 8) : []

  return {
    kind: record.kind === "blog" ? "blog" : "social",
    title: stripQuotes(String(record.title ?? "")),
    caption: stripQuotes(String(record.caption ?? "")),
    body: record.body ? String(record.body) : null,
    offer: {
      headline: stripQuotes(String(offer.headline ?? "")),
      detail: stripQuotes(String(offer.detail ?? "")),
      expiresInDays: Number(offer.expiresInDays ?? 7),
      cta: stripQuotes(String(offer.cta ?? "Get your estimate")),
    },
    platforms,
    imagePrompt: typeof record.imagePrompt === "string" && record.imagePrompt.trim() ? record.imagePrompt.trim() : undefined,
    tags,
    category: typeof record.category === "string" && record.category.trim() ? record.category.trim() : undefined,
  }
}

/**
 * Parse the LLM batch response. Accepts either a JSON array of posts (batch)
 * or a single JSON object (legacy single-draft call) and returns the posts
 * in order, normalized. Never throws — returns null when unparseable.
 */
export function parseDraftOutputs(text: string): DraftOutput[] | null {
  const trimmed = text.trim()

  const arrayStart = trimmed.indexOf("[")
  const arrayEnd = trimmed.lastIndexOf("]")
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      const raw = JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1))
      if (!Array.isArray(raw)) return null
      const out = raw
        .map((item) => (item && typeof item === "object" ? toDraftOutput(item as Record<string, unknown>) : null))
        .filter((r): r is DraftOutput => r !== null)
      return out.length ? out : null
    } catch {
      return null
    }
  }

  const single = parseDraftOutput(trimmed)
  return single ? [single] : null
}

function parseDraftOutput(text: string): DraftOutput | null {
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null

  let obj: unknown
  try {
    obj = JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }

  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null
  return toDraftOutput(obj as Record<string, unknown>)
}

async function buildContentContext(): Promise<string> {
  const [rates, recentPosts, postCount, orderCount, leadCount, subscriberCount, revenueAgg] = await Promise.all([
    prisma.regionRate.findMany({
      where: { published: true },
      orderBy: { multiplier: "desc" },
      take: 5,
      select: { name: true, capital: true, multiplier: true, cementBag: true, labourRate: true },
    }),
    prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, category: true, published: true },
    }),
    prisma.blogPost.count(),
    prisma.order.count(),
    prisma.calculatorLead.count(),
    prisma.newsletterSubscriber.count(),
    prisma.order.aggregate({ _sum: { amount: true } }),
  ])

  const rateLines = rates.length
    ? rates.map((r) => `- ${r.name} (${r.capital}): ${r.multiplier.toFixed(2)}x vs Accra, cement GHS ${r.cementBag}/bag, labour GHS ${r.labourRate}/day`)
    : ["- No published region rates yet"]
  const postLines = recentPosts.length
    ? recentPosts.map((p) => `- "${p.title}" [${p.category}, ${p.published ? "published" : "draft"}]`)
    : ["- No blog posts yet"]

  return [
    `Today's date: ${new Date().toISOString().slice(0, 10)}`,
    `Published region rate database (${rates.length} of total regions):`,
    ...rateLines,
    "",
    `Blog: ${postCount} total posts. Most recent:`,
    ...postLines,
    "",
    `Business: ${orderCount} orders (GHS ${revenueAgg._sum.amount ?? 0} total), ${leadCount} calculator leads, ${subscriberCount} newsletter subscribers.`,
    "Products: Basic Report USD 29, Detailed Report USD 79, Premium Report USD 199 (billed in GHS via MTN MoMo, diaspora pays USD).",
    "Subscriptions: Unlimited at USD 19/mo or USD 99/yr.",
    "App URL: https://buildcostgh.com (calculator at /calculator, regional costs at /costs).",
  ].join("\n")
}

/**
 * Run the Content agent to draft a themed post + offer from live business data.
 * Creates a ContentDraft row with status "draft". Never publishes.
 *
 * When `slot` is provided the output is pinned to that plan slot: kind, pillar,
 * topic, keyword, offer, and platforms all come from the plan line.
 */
export async function generateContentDraft(options?: {
  platforms?: SocialPlatform[]
  slot?: PlannedSlot
}): Promise<{ draft: { id: string; title: string } | null; error?: string }> {
  const spec = getSubagent("content")
  if (!spec) return { draft: null, error: "Content subagent not found" }

  if (!process.env.OPENAI_API_KEY) {
    return { draft: null, error: "OPENAI_API_KEY is not configured" }
  }

  const slot = options?.slot
  const platforms = slot?.platforms?.length ? slot.platforms : options?.platforms?.length ? options.platforms : getConfiguredPlatforms().length ? getConfiguredPlatforms() : ["facebook"]

  let context: string
  try {
    context = await buildContentContext()
  } catch (err) {
    return { draft: null, error: `Failed to load business context: ${err instanceof Error ? err.message : String(err)}` }
  }

  const planLines = slot
    ? [
        "CONTENT PLAN SLOT (follow this exactly):",
        `- Date: ${slot.dateKey} (weekday ${slot.weekday})`,
        `- Type: ${slot.kind}`,
        `- Pillar: ${slot.pillarTitle}`,
        `- Topic to develop: ${slot.topic}`,
        slot.keyword ? `- Target SEO keyword (blog): ${slot.keyword}` : null,
        `- Format hint: ${slot.formatHint}`,
        `- Offer to feature: ${slot.offer.headline} — ${slot.offer.detail} (CTA: ${slot.offer.cta})`,
      ].filter((l): l is string => l !== null)
    : null

  const prompt = `Create one strategic social media post and an irresistible offer for BuildCostGH.

REAL BUSINESS CONTEXT (ground every claim in this — never invent numbers, prices, or features):
${context}

Target platforms: ${platforms.join(", ")}.

${slot && planLines ? `${planLines.join("\n")}\n\n` : ""}TASK
1. ${slot ? `Develop the exact topic "${slot.topic}" (pillar: ${slot.pillarTitle}) ${slot.keyword ? `and target the keyword "${slot.keyword}" ` : ""}with the format hint: ${slot.formatHint}` : "Pick a timely, high-engagement angle for Ghanaians (home) and the diaspora (abroad): e.g. regional cost insight from the rate database, rainy-season/flood planning, \"how much does a house really cost in Ghana\", a limited-time offer on reports, or the free-calculator → paid-report funnel."}
2. Write a punchy post (caption) under 500 characters that hooks, educates, and drives a click to /calculator or /costs.
3. Write a compelling, honest offer based ONLY on real products/prices above${slot ? ` and the slot offer "${slot.offer.headline}"` : " (e.g. a discount off Detailed/Premium reports, or a bundle)"}. Do not invent new products or prices.
4. ${slot?.kind === "blog" ? `Write a full long-form blog body (700-1100 words) with headings and a cost table/range for "${slot.topic}", ending with an FAQ-style closing and a promo caption. ` : "Optionally write a longer body (LinkedIn/X thread or blog intro) of up to 400 words. "}

RETURN ONLY a single JSON object, no markdown, no commentary:
{
  "kind": ${JSON.stringify(slot?.kind ?? "social")},
  "title": "short punchy headline",
  "caption": "the social post caption",
  "body": ${slot?.kind === "blog" ? "\"the full long-form blog body\"" : "\"optional extended content or null\""},
  "offer": {
    "headline": "offer headline",
    "detail": "1-2 sentences describing the offer",
    "expiresInDays": <number>,
    "cta": "call to action text"
  },
  "platforms": [${platforms.map((p) => `"${p}"`).join(", ")}]
}`

  let text: string
  try {
    text = await runSubagent({ ...spec, maxTokens: 1400 }, prompt)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await logAgentAction({
      agent: CONTENT_AGENT,
      action: "draft_generation_failed",
      entityType: "content_draft",
      level: "error",
      details: { error: message },
    })
    return { draft: null, error: message }
  }

  const parsed = parseDraftOutput(text)
  if (!parsed || !parsed.title || !parsed.caption) {
    await logAgentAction({
      agent: CONTENT_AGENT,
      action: "draft_parse_failed",
      entityType: "content_draft",
      level: "warning",
      details: { raw: text.slice(0, 500) },
    })
    return { draft: null, error: "Content agent returned unparseable output; review the agent logs for the raw response." }
  }

  const draftPlatforms = parsed.platforms.length ? parsed.platforms : platforms
  const source = slot
    ? `content-plan:${slot.dateKey}:${slot.pillarKey}:${slot.topicIndex}`
    : "content-agent"

  const draft = await prisma.contentDraft.create({
    data: {
      kind: slot ? slot.kind : parsed.kind,
      title: parsed.title,
      caption: parsed.caption,
      body: parsed.body,
      offer: slot ? slot.offer as object : parsed.offer as object,
      platforms: slot ? slot.platforms as string[] : draftPlatforms as string[],
      source,
    },
    select: { id: true, title: true },
  })

  await logAgentAction({
    agent: CONTENT_AGENT,
    action: "draft_generated",
    entityType: "content_draft",
    entityId: draft.id,
    level: "success",
    details: {
      title: parsed.title,
      platforms: slot ? slot.platforms : draftPlatforms,
      source,
    },
  })

  return { draft }
}

// ═══════════════════════════════════════════════════════════
// BATCH GENERATION
// ═══════════════════════════════════════════════════════════

/**
 * Number of plan slots sent to the LLM in a single call. Larger batches are
 * cheaper/faster but risk timeout + token limits (a blog body is ~1.5k tokens).
 */
export const CONTENT_PLAN_BATCH_SIZE = Number(process.env.CONTENT_PLAN_BATCH_SIZE ?? 3) || 1

export type BatchGeneratedDraft = {
  id: string
  title: string
  kind: DraftKind
  imageUrl: string | null
  blogPostId?: string
}

const BLOG_AUTHOR = "BuildCostGH"
const BLOG_AUTHOR_BIO =
  "BuildCostGH is Ghana's construction cost estimation platform, helping Ghanaians at home and in the diaspora plan and budget building projects from market-verified rates."

/**
 * Map a plan pillar key to a blog category (schema default is "uncategorized").
 */
export function blogCategoryFor(pillarKey: string): string {
  return pillarKey.replace(/-/g, "-")
}

/**
 * ASCII slug from a post title, e.g. "How Much Does a 4-Bedroom House Cost in Ghana?"
 * → "how-much-does-a-4-bedroom-house-cost-in-ghana".
 */
export function slugifyTitle(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base || "post"
}

async function uniqueBlogSlug(title: string): Promise<string> {
  const base = slugifyTitle(title)
  let candidate = base
  let n = 2
  while (await prisma.blogPost.findUnique({ where: { slug: candidate } })) {
    candidate = `${base}-${n++}`
  }
  return candidate
}

function estimateReadTime(body: string | null): number {
  if (!body) return 0
  const words = body.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

/**
 * Create a published:false SEO BlogPost row from a drafted blog slot so the
 * post is ready to review in the admin blog editor. Runs inside the batch.
 */
async function createBlogPostDraft(slot: PlannedSlot, parsed: DraftOutput): Promise<string | undefined> {
  if (parsed.kind !== "blog" && slot.kind !== "blog") return undefined
  const body = parsed.body || `<!-- Body for "${parsed.title}" in progress. -->${parsed.caption}`
  const slug = await uniqueBlogSlug(parsed.title)

  const post = await prisma.blogPost.create({
    data: {
      title: parsed.title,
      slug,
      excerpt: parsed.caption,
      content: body,
      author: BLOG_AUTHOR,
      authorBio: BLOG_AUTHOR_BIO,
      tags: JSON.stringify(parsed.tags?.length ? parsed.tags : [slot.pillarKey]),
      category: blogCategoryFor(slot.pillarKey),
      readTimeMin: estimateReadTime(body),
      published: false,
    },
    select: { id: true },
  })

  await logAgentAction({
    agent: CONTENT_AGENT,
    action: "blog_draft_created",
    entityType: "blog_post",
    entityId: post.id,
    level: "success",
    details: { slug, pillar: slot.pillarKey, source: sourceFor(slot) },
  })

  return post.id
}

function sourceFor(slot: PlannedSlot): string {
  return `content-plan:${slot.dateKey}:${slot.pillarKey}:${slot.topicIndex}`
}

function slotContextLines(slot: PlannedSlot): string[] {
  return [
    `- Date: ${slot.dateKey} (weekday ${slot.weekday})`,
    `- Type: ${slot.kind}`,
    `- Pillar: ${slot.pillarTitle}`,
    `- Topic to develop: ${slot.topic}`,
    slot.keyword ? `- Target SEO keyword (blog): ${slot.keyword}` : null,
    `- Format hint: ${slot.formatHint}`,
    `- Offer to feature: ${slot.offer.headline} — ${slot.offer.detail} (CTA: ${slot.offer.cta})`,
  ].filter((l): l is string => l !== null)
}

/**
 * Create one image for a drafted post when image generation is enabled for the
 * platform mix. Image prompts come from the LLM output; the binary is stored
 * under /public/content-images and the URL is recorded on the ContentDraft.
 */
async function attachImageToDraft(draftId: string, parsed: DraftOutput): Promise<string | null> {
  if (!imageGenerationEnabled() || !parsed.imagePrompt) return null
  try {
    const { imageUrl } = await generatePostImage(parsed.imagePrompt)
    await prisma.contentDraft.update({ where: { id: draftId }, data: { imageUrl } })
    return imageUrl
  } catch (err) {
    await logAgentAction({
      agent: CONTENT_AGENT,
      action: "image_generation_failed",
      entityType: "content_draft",
      entityId: draftId,
      level: "warning",
      details: { error: err instanceof Error ? err.message : String(err), prompt: parsed.imagePrompt.slice(0, 120) },
    })
    return null
  }
}

/**
 * Batch content generation for the Content Plan.
 *
 * Sends `batchSize` plan slots per LLM call (deterministic order) and asks for
 * one post per slot. Each returned post becomes a ContentDraft row (never
 * auto-published); blog slots additionally get a published:false BlogPost
 * draft; an image prompt is collected per post and rendered when image
 * generation is enabled.
 *
 * Returns every draft created (in slot order) so the caller can report back.
 */
export async function generateContentBatch(
  slots: PlannedSlot[],
  options?: { batchSize?: number; generateImages?: boolean }
): Promise<{ drafts: BatchGeneratedDraft[]; error?: string }> {
  if (!slots.length) return { drafts: [] }

  const spec = getSubagent("content")
  if (!spec) return { drafts: [], error: "Content subagent not found" }
  if (!process.env.OPENAI_API_KEY) {
    return { drafts: [], error: "OPENAI_API_KEY is not configured" }
  }

  const wantImages = options?.generateImages ?? true
  const batchSize = Math.max(1, Math.min(5, options?.batchSize ?? CONTENT_PLAN_BATCH_SIZE))

  let context: string
  try {
    context = await buildContentContext()
  } catch (err) {
    return { drafts: [], error: `Failed to load business context: ${err instanceof Error ? err.message : String(err)}` }
  }

  const drafts: BatchGeneratedDraft[] = []

  for (let offset = 0; offset < slots.length; offset += batchSize) {
    const chunk = slots.slice(offset, offset + batchSize)
    const slotLines = chunk.map((s, i) => [`-- Slot ${i} --`, ...slotContextLines(s)].join("\n")).join("\n\n")

    const prompt = `Create ${chunk.length} strategic social media post(s) for BuildCostGH — one per content-plan slot below.

REAL BUSINESS CONTEXT (ground every claim in this — never invent numbers, prices, or features):
${context}

CONTENT PLAN SLOTS (output EXACTLY ONE post per slot, in the SAME ORDER):
${slotLines}

TASK (apply to every post):
1. Develop the exact topic from the slot (pillar + topic + format hint${chunk.some((c) => c.keyword) ? " + target SEO keyword on blog slots" : ""}).
2. Write a punchy caption under 500 characters that hooks, educates, and drives a click to /calculator or /costs.
3. Write a compelling, honest offer based ONLY on real products/prices above and the slot's offer headline. Do not invent products or prices.
4. Blog-type slots: write a full long-form blog body (700-1100 words) with headings and a cost table/range, ending FAQ-style. Social slots: optional extended body up to 400 words.
5. For every post, write an "imagePrompt": a single vivid sentence describing the visual for the social graphic (photorealistic, no text overlays, Ghana setting). Use null for blog-first posts.

RETURN ONLY a single JSON ARRAY with EXACTLY ${chunk.length} objects, in the same order as the slots, no markdown, no commentary:
[
  {
    "kind": "social" | "blog",
    "title": "short punchy headline",
    "caption": "the social post caption",
    "body": "extended/blog body or null",
    "offer": { "headline": "...", "detail": "...", "expiresInDays": <number>, "cta": "..." },
    "platforms": [${chunk[0].platforms.map((p) => `"${p}"`).join(", ")}],
    "imagePrompt": "visual description or null",
    "tags": ["topic","keyword"]
  }
]`

    let text: string
    try {
      // blog bodies are long; scale maxTokens by the chunk size
      text = await runSubagent({ ...spec, maxTokens: Math.min(2800 * chunk.length, 9000) }, prompt)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await logAgentAction({
        agent: CONTENT_AGENT,
        action: "batch_generation_failed",
        entityType: "content_draft",
        level: "error",
        details: { chunkSize: chunk.length, error: message },
      })
      return { drafts, error: message }
    }

    const parsed = parseDraftOutputs(text)
    if (!parsed) {
      await logAgentAction({
        agent: CONTENT_AGENT,
        action: "batch_parse_failed",
        entityType: "content_draft",
        level: "warning",
        details: { chunkSize: chunk.length, raw: text.slice(0, 500) },
      })
      return { drafts, error: "Content agent returned unparseable batch output; check agent logs." }
    }

    for (let i = 0; i < chunk.length; i++) {
      const slot = chunk[i]
      // A malformed entry in the middle should not kill the whole batch.
      const item = parsed[i] ?? (parsed.length === 1 ? parsed[0] : null)
      if (!item || !item.title || !item.caption) {
        await logAgentAction({
          agent: CONTENT_AGENT,
          action: "batch_item_parse_failed",
          entityType: "content_draft",
          level: "warning",
          details: { slot: slot.dateKey, index: i, raw: text.slice(0, 300) },
        })
        continue
      }

      const draftPlatforms = item.platforms.length ? item.platforms : slot.platforms
      const draft = await prisma.contentDraft.create({
        data: {
          kind: slot.kind,
          title: item.title,
          caption: item.caption,
          body: item.body,
          offer: slot.offer as object,
          platforms: slot.platforms as string[],
          source: sourceFor(slot),
        },
        select: { id: true, title: true },
      })

      await logAgentAction({
        agent: CONTENT_AGENT,
        action: "draft_generated",
        entityType: "content_draft",
        entityId: draft.id,
        level: "success",
        details: { title: item.title, slot: slot.dateKey, pillars: slot.pillarKey, batch: true },
      })

      const blogPostId = await createBlogPostDraft(slot, item)
      const imageUrl = wantImages ? await attachImageToDraft(draft.id, item) : null

      drafts.push({
        id: draft.id,
        title: item.title,
        kind: slot.kind,
        imageUrl,
        blogPostId,
      })
    }
  }

  return { drafts }
}

/**
 * Cadence guard for the scheduled cron: only generate when the latest draft is
 * older than `cadenceHours` (default 24). Prevents duplicate drafts per day.
 */
export async function shouldGenerateDraft(cadenceHours = 24): Promise<boolean> {
  const latest = await prisma.contentDraft.findFirst({ orderBy: { createdAt: "desc" }, select: { createdAt: true } })
  if (!latest) return true
  const ageMs = Date.now() - new Date(latest.createdAt).getTime()
  return ageMs > cadenceHours * 3600_000
}
