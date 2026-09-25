/**
 * Pure, testable ResearchBot helpers — no "server-only", no I/O.
 *
 * The ResearchBot grounds content and rate decisions in evidence:
 * - ResearchBrief: verified data points + quotable lines for an upcoming
 *   content slot, built from RegionRate rows (+ field observations).
 * - RateProposal: a diff of observed vs stored rates. Proposals NEVER write
 *   to the database here; a founder approves them in the admin Rates tab.
 *
 * Auto-publish rule (tiered publishing): a brief is eligible for automatic
 * publishing only when it has at least one data point and EVERY point is
 * `verified`. Anything else falls back to founder approval.
 */

export type Confidence = "verified" | "single-source" | "estimated"

export type RateField =
  | "multiplier"
  | "labourRate"
  | "cementBag"
  | "rebarTon"
  | "block"
  | "sandTrip"
  | "graniteTrip"
  | "timber"
  | "roofingSqm"
  | "dieselLit"
  | "paintLit"

export const RATE_FIELDS: RateField[] = [
  "multiplier",
  "labourRate",
  "cementBag",
  "rebarTon",
  "block",
  "sandTrip",
  "graniteTrip",
  "timber",
  "roofingSqm",
  "dieselLit",
  "paintLit",
]

export const RATE_FIELD_META: Record<RateField, { label: string; unit: string }> = {
  multiplier: { label: "Regional cost multiplier", unit: "x Accra" },
  labourRate: { label: "Artisan day rate", unit: "GHS/day" },
  cementBag: { label: "Cement (50kg bag)", unit: "GHS/bag" },
  rebarTon: { label: "Steel reinforcement", unit: "GHS/tonne" },
  block: { label: "Block", unit: "GHS/block" },
  sandTrip: { label: "Sand (tipper trip)", unit: "GHS/trip" },
  graniteTrip: { label: "Granite chippings (tipper trip)", unit: "GHS/trip" },
  timber: { label: "Timber (standard length)", unit: "GHS/length" },
  roofingSqm: { label: "Roofing installed", unit: "GHS/sqm" },
  dieselLit: { label: "Diesel", unit: "GHS/litre" },
  paintLit: { label: "Paint", unit: "GHS/litre" },
}

/** Minimal structural view of a RegionRate row — RegionRate satisfies this. */
export type RateRow = {
  slug: string
  name: string
  capital: string
  source: string | null
  updatedAt: Date | string
} & Record<RateField, number>

/** A manually gathered market observation (supplier call, field survey, scraper). */
export type FieldObservation = {
  regionSlug: string
  field: RateField
  value: number
  source: string
  observedAt: Date | string
}

export type DataPoint = {
  field: RateField
  label: string
  unit: string
  regions: Array<{ slug: string; name: string; value: number }>
  sources: string[]
  observedAt: string | null
  confidence: Confidence
}

export type ResearchBrief = {
  slotKey: string
  pillarKey: string
  topic: string
  points: DataPoint[]
  quotables: string[]
  eligibleForAutoPublish: boolean
  generatedAt: string
}

export type RateProposal = {
  regionSlug: string
  regionName: string
  field: RateField
  label: string
  unit: string
  oldValue: number
  proposedValue: number
  changePct: number
  evidence: string[]
  confidence: Confidence
}

/** Which rate fields each content pillar cares about. */
export const PILLAR_FIELDS: Record<string, RateField[]> = {
  "materials-prices": ["cementBag", "rebarTon", "block", "sandTrip", "graniteTrip", "timber", "roofingSqm", "dieselLit"],
  "region-pricing": ["multiplier", "labourRate", "cementBag", "rebarTon"],
  "cost-guides": ["cementBag", "block", "labourRate", "roofingSqm"],
  "cost-comparisons": ["cementBag", "block", "timber", "roofingSqm", "labourRate"],
  "stage-budgets": ["cementBag", "block", "rebarTon", "sandTrip", "graniteTrip", "timber", "roofingSqm", "paintLit", "labourRate"],
  "contractor-legal": ["labourRate", "multiplier"],
  "financing-crypto": ["cementBag", "multiplier", "dieselLit"],
  "safety-security": ["cementBag", "timber", "roofingSqm", "sandTrip"],
  "brand-evergreen": ["cementBag", "multiplier", "labourRate"],
}

export function fieldsForPillar(pillarKey: string): RateField[] {
  return PILLAR_FIELDS[pillarKey] ?? ["cementBag", "multiplier", "labourRate"]
}

const DAY_MS = 86_400_000
const RECENT_DAYS = 240

function daysBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / DAY_MS
}

function distinctSources(sources: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  for (const s of sources) {
    const t = (s ?? "").trim()
    if (t) seen.add(t.toLowerCase())
  }
  return [...seen]
}

function isRecent(observedAt: Date | string | null, now: Date): boolean {
  if (!observedAt) return false
  const d = observedAt instanceof Date ? observedAt : new Date(observedAt)
  if (Number.isNaN(d.getTime())) return false
  return daysBetween(d, now) <= RECENT_DAYS
}

/**
 * Confidence for one data point backed by N regional reports.
 * verified = 2+ distinct recent sources corroborating (single-region points
 * can only be verified when a matching field observation corroborates).
 */
export function classifyConfidence(
  sources: Array<string | null | undefined>,
  observedDates: Array<Date | string | null>,
  now: Date = new Date()
): Confidence {
  const distinct = distinctSources(sources)
  if (distinct.length === 0) return "estimated"
  const recent = observedDates.filter((d) => isRecent(d, now)).length
  if (distinct.length >= 2 && recent >= 2) return "verified"
  if (distinct.length >= 2) return "single-source"
  return recent >= 1 ? "single-source" : "estimated"
}

export function isAutoPublishEligible(brief: Pick<ResearchBrief, "points">): boolean {
  return brief.points.length > 0 && brief.points.every((p) => p.confidence === "verified")
}

function fmt(n: number): string {
  return n % 1 === 0 ? n.toLocaleString("en-GH") : n.toLocaleString("en-GH", { maximumFractionDigits: 2 })
}

/**
 * Build a research brief for one content slot from stored region rates plus
 * optional fresh field observations (which corroborate and can lift a point
 * to verified).
 */
export function buildBriefForSlot(
  slot: { dateKey: string; pillarKey: string; topic: string },
  rates: RateRow[],
  observations: FieldObservation[] = [],
  now: Date = new Date()
): ResearchBrief {
  const fields = fieldsForPillar(slot.pillarKey)
  const points: DataPoint[] = []

  for (const field of fields) {
    const meta = RATE_FIELD_META[field]
    const regions: DataPoint["regions"] = []
    const sources: string[] = []
    const dates: Array<Date | string | null> = []

    for (const row of rates) {
      const value = row[field]
      if (typeof value !== "number" || value <= 0) continue
      regions.push({ slug: row.slug, name: row.name, value })
      if (row.source) sources.push(row.source)
      dates.push(row.updatedAt ?? null)

      const corroborating = observations.filter(
        (o) => o.regionSlug === row.slug && o.field === field && o.value > 0
      )
      for (const o of corroborating) {
        sources.push(o.source)
        dates.push(o.observedAt)
      }
    }

    if (regions.length === 0) continue
    points.push({
      field,
      label: meta.label,
      unit: meta.unit,
      regions,
      sources: [...new Set(sources)],
      observedAt: null,
      confidence: classifyConfidence(sources, dates, now),
    })
  }

  const quotables = buildQuotables(points)
  const brief: ResearchBrief = {
    slotKey: `${slot.dateKey}:${slot.pillarKey}`,
    pillarKey: slot.pillarKey,
    topic: slot.topic,
    points,
    quotables,
    eligibleForAutoPublish: false,
    generatedAt: now.toISOString(),
  }
  brief.eligibleForAutoPublish = isAutoPublishEligible(brief)
  return brief
}

function buildQuotables(points: DataPoint[]): string[] {
  const lines: string[] = []
  for (const p of points.slice(0, 3)) {
    if (p.regions.length === 0) continue
    const sorted = [...p.regions].sort((a, b) => a.value - b.value)
    const cheapest = sorted[0]
    const priciest = sorted[sorted.length - 1]
    if (sorted.length >= 2 && priciest.value > cheapest.value) {
      lines.push(
        `${p.label}: ${cheapest.name} ${fmt(cheapest.value)} ${p.unit} vs ${priciest.name} ${fmt(priciest.value)} ${p.unit} (${p.confidence}).`
      )
    } else {
      lines.push(`${p.label}: ${fmt(cheapest.value)} ${p.unit} in ${cheapest.name} (${p.confidence}).`)
    }
  }
  return lines
}

/**
 * Diff fresh observations against stored rates. Returns only real changes —
 * identical values are dropped. Never writes to the database.
 */
export function proposeRateUpdates(
  current: RateRow[],
  observations: FieldObservation[],
  now: Date = new Date()
): RateProposal[] {
  const bySlug = new Map(current.map((r) => [r.slug, r]))
  const proposals: RateProposal[] = []

  for (const o of observations) {
    const row = bySlug.get(o.regionSlug)
    if (!row || o.value <= 0) continue
    const oldValue = row[o.field]
    if (typeof oldValue !== "number" || oldValue === o.value) continue
    const meta = RATE_FIELD_META[o.field]
    const evidence = [o.source, row.source].filter((s): s is string => !!s && s.trim().length > 0)
    proposals.push({
      regionSlug: row.slug,
      regionName: row.name,
      field: o.field,
      label: meta.label,
      unit: meta.unit,
      oldValue,
      proposedValue: o.value,
      changePct: oldValue === 0 ? 100 : Math.round(((o.value - oldValue) / oldValue) * 1000) / 10,
      evidence,
      confidence: classifyConfidence([o.source, row.source], [o.observedAt, row.updatedAt ?? null], now),
    })
  }

  return proposals
}

export function summarizeBrief(brief: ResearchBrief): string {
  const verified = brief.points.filter((p) => p.confidence === "verified").length
  return `${brief.slotKey}: ${brief.points.length} points (${verified} verified) — ${brief.topic}`
}
