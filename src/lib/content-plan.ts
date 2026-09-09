import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type PlanPlatform = "facebook" | "instagram" | "x" | "linkedin" | "tiktok"
export type DraftKind = "social" | "blog"

export type OfferSpec = {
  headline: string
  detail: string
  expiresInDays?: number
  cta: string
}

export type ScheduleSlot = {
  weekday: number // 0 = Sunday ... 6 = Saturday
  kind: DraftKind
  slotIndex: number | null // position in socialRotation (social slots only)
  platforms: PlanPlatform[]
  formatHint: string
}

export type PillarSpec = {
  title: string
  description: string
  topicPool: string[]
  blogKeywords: string[]
}

export type ContentPlan = {
  schemaVersion: number
  meta: {
    title: string
    description: string
    rollingStart: string // YYYY-MM-DD
    rollingMonths: number
    postsPerWeek: number
    language: string
    publishingMode: string
    batchMode: string
  }
  schedule: ScheduleSlot[]
  socialRotation: string[]
  blogRotation: string[]
  offers: OfferSpec[]
  pillars: Record<string, PillarSpec>
}

/**
 * A single resolved content slot for an exact calendar date.
 */
export type PlannedSlot = {
  dateKey: string // YYYY-MM-DD
  weekday: number
  kind: DraftKind
  platforms: PlanPlatform[]
  pillarKey: string
  pillarTitle: string
  topic: string
  topicIndex: number
  keyword?: string
  offer: OfferSpec
  offerIndex: number
  formatHint: string
  slotIndex: number | null
  hasDraft?: boolean
}

const DAY_MS = 86_400_000

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function weekIndexForDate(plan: ContentPlan, dateKey: string): number {
  const start = parseDateKey(plan.meta.rollingStart).getTime()
  const target = parseDateKey(dateKey).getTime()
  if (Number.isNaN(start) || Number.isNaN(target)) return 0
  return Math.max(0, Math.floor((target - start) / DAY_MS / 7))
}

export function isWithinRollingWindow(plan: ContentPlan, dateKey: string): boolean {
  const start = parseDateKey(plan.meta.rollingStart).getTime()
  const end = start + Math.max(1, plan.meta.rollingMonths) * 30 * DAY_MS
  const target = parseDateKey(dateKey).getTime()
  return !Number.isNaN(target) && target >= start && target <= end
}

export function getScheduleSlot(plan: ContentPlan, weekday: number): ScheduleSlot | undefined {
  return plan.schedule.find((s) => s.weekday === weekday)
}

export function resolvePillarKey(plan: ContentPlan, slot: ScheduleSlot, weekIndex: number): string | null {
  const rotation = slot.kind === "blog" ? plan.blogRotation : plan.socialRotation
  if (!rotation.length) return null
  if (slot.kind === "blog") return rotation[weekIndex % rotation.length]
  const index = slot.slotIndex ?? 0
  return rotation[(weekIndex * 4 + index) % rotation.length]
}

export function resolveSlotOffer(plan: ContentPlan, weekIndex: number): OfferSpec {
  if (!plan.offers.length) {
    return { headline: "Get your free estimate", detail: "Try the BuildCostGH calculator for a ballpark figure.", cta: "Get estimate" }
  }
  return plan.offers[weekIndex % plan.offers.length]
}

export type TopicCounts = Record<string, number>

/**
 * Resolve every upcoming plan window slot (including already-drafted ones).
 *
 * Pure + deterministic: no I/O, no DB. `existingDateKeys` holds strings of the
 * form `content-plan:<YYYY-MM-DD>:` already covered by a draft (derived from
 * ContentDraft.source rows); matching slots get `hasDraft: true`.
 *
 * `counts` is mutated: each slot that still needs a draft consumes the next
 * topic of its pillar. Pass the accumulated counts between batches so topic
 * rotation keeps advancing across runs.
 */
export function computeWindowSlots(
  plan: ContentPlan,
  from: Date,
  horizonDays: number,
  existingDateKeys: Set<string>,
  counts: TopicCounts = {}
): PlannedSlot[] {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const slots: PlannedSlot[] = []

  for (let offset = 0; offset < horizonDays; offset++) {
    const date = new Date(base.getTime() + offset * DAY_MS)
    const dateKey = toDateKey(date)
    if (!isWithinRollingWindow(plan, dateKey)) break
    const weekday = date.getDay()
    const slot = getScheduleSlot(plan, weekday)
    if (!slot) continue

    const weekIndex = weekIndexForDate(plan, dateKey)
    const pillarKey = resolvePillarKey(plan, slot, weekIndex)
    if (!pillarKey || !plan.pillars[pillarKey]) continue

    const hasDraft = existingDateKeys.has(`content-plan:${dateKey}:`)

    const pillar = plan.pillars[pillarKey]
    const consumed = counts[pillarKey] ?? 0

    /**
     * A slot already drafted has already consumed its topic; only advance the
     * counter for slots that still need a new draft so rotation stays correct.
     */
    if (!hasDraft) counts[pillarKey] = consumed + 1

    const topic = pillar.topicPool[consumed % pillar.topicPool.length]
    const keyword = slot.kind === "blog" ? pillar.blogKeywords[consumed % pillar.blogKeywords.length] : undefined

    slots.push({
      dateKey,
      weekday,
      kind: slot.kind,
      platforms: slot.platforms,
      pillarKey,
      pillarTitle: pillar.title,
      topic,
      topicIndex: consumed,
      keyword,
      offer: resolveSlotOffer(plan, weekIndex),
      offerIndex: weekIndex % plan.offers.length,
      formatHint: slot.formatHint,
      slotIndex: slot.slotIndex,
      hasDraft,
    })
  }

  return slots
}

export function pendingSlotsOf(slots: PlannedSlot[]): PlannedSlot[] {
  return slots.filter((s) => !s.hasDraft)
}

/**
 * Human-readable one-line label for a plan slot (used in admin + logs).
 */
export function describeSlot(item: PlannedSlot): string {
  return `${item.dateKey} [${item.kind}] ${item.pillarTitle}: ${item.topic} (${item.platforms.join(", ")})`
}

export const CONTENT_PLAN_PATH = join(process.cwd(), "content", "content-plan.json")

/**
 * Read + parse the plan file from disk. Returns null when missing/invalid so
 * callers can fall back to the legacy single-draft engine. (Plan-edits take
 * effect on the next deploy; the file is bundled into the cron lambda via
 * next.config `outputFileTracingIncludes`.)
 */
export function loadContentPlan(rootDir: string | undefined = process.cwd()): ContentPlan | null {
  try {
    const filePath = rootDir ? join(rootDir, "content", "content-plan.json") : CONTENT_PLAN_PATH
    if (!existsSync(filePath)) return null
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as ContentPlan
    return normalizePlan(raw)
  } catch {
    return null
  }
}

export function normalizePlan(raw: Partial<ContentPlan> | null | undefined): ContentPlan | null {
  if (!raw || !raw.schedule || !raw.pillars) return null
  const meta = raw.meta ?? {}
  return {
    schemaVersion: raw.schemaVersion ?? 1,
    meta: {
      title: meta.title ?? "BuildCostGH Content Plan",
      description: meta.description ?? "",
      rollingStart: meta.rollingStart ?? new Date().toISOString().slice(0, 10),
      rollingMonths: meta.rollingMonths ?? 12,
      postsPerWeek: meta.postsPerWeek ?? 5,
      language: meta.language ?? "en",
      publishingMode: meta.publishingMode ?? "founder-approval",
      batchMode: meta.batchMode ?? "fill-ahead-weekly",
    },
    schedule: raw.schedule,
    socialRotation: raw.socialRotation ?? [],
    blogRotation: raw.blogRotation ?? [],
    offers: raw.offers ?? [],
    pillars: raw.pillars,
  }
}