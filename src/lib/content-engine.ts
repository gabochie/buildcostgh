import "server-only"
import { prisma } from "./prisma"
import { runSubagent } from "./cofounder/agent"
import { getSubagent } from "./cofounder/subagents"
import { logAgentAction } from "./agent-log"
import { getConfiguredPlatforms, type SocialPlatform } from "./social"
import type { PlannedSlot } from "./content-plan"

export const CONTENT_AGENT = "ContentBot"

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
}

function stripQuotes(value: string): string {
  const v = value.trim()
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1)
  }
  return v
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

  const record = (obj ?? {}) as Record<string, unknown>
  const offer = (record.offer ?? {}) as Record<string, unknown>
  const platforms = Array.isArray(record.platforms) ? record.platforms.filter((p): p is SocialPlatform => typeof p === "string") : []

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
  }
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
  })

  return { draft }
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
