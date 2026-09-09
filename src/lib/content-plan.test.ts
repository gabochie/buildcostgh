import { test } from "node:test"
import assert from "node:assert/strict"
import { join } from "node:path"
import {
  toDateKey,
  parseDateKey,
  weekIndexForDate,
  isWithinRollingWindow,
  getScheduleSlot,
  resolvePillarKey,
  computeWindowSlots,
  pendingSlotsOf,
  describeSlot,
  loadContentPlan,
  normalizePlan,
  type ContentPlan,
  type PlannedSlot,
} from "./content-plan"
import type { TopicCounts } from "./content-plan"

const REPO_ROOT = join(import.meta.dirname, "..", "..")

function testPlan(): ContentPlan {
  const plan = loadContentPlan(REPO_ROOT)
  assert.ok(plan, "content/content-plan.json must load in tests")
  return plan
}

/* ── helpers ──────────────────────────────────────────────────────────── */

test("toDateKey / parseDateKey round-trip", () => {
  const date = new Date(2026, 8, 9) // Sep 9 2026
  const key = toDateKey(date)
  assert.equal(key, "2026-09-09")
  const back = parseDateKey(key)
  assert.equal(toDateKey(back), key)
})

test("normalizePlan rejects null", () => {
  assert.equal(normalizePlan(null), null)
  assert.equal(normalizePlan(undefined), null)
})

test("normalizePlan returns plan with missing meta filled from defaults", () => {
  const plan = normalizePlan({
    schedule: [{ weekday: 1, kind: "social", slotIndex: 0, platforms: ["facebook"], formatHint: "x" }],
    socialRotation: ["a"],
    blogRotation: ["a"],
    offers: [],
    pillars: { a: { title: "A", description: "", topicPool: ["t"], blogKeywords: ["k"] } },
  } as Partial<ContentPlan>)
  assert.ok(plan)
  assert.equal(plan.meta.language, "en")
  assert.ok(plan.meta.rollingMonths >= 1)
})

test("loadContentPlan reads content/content-plan.json from disk", () => {
  const plan = testPlan()
  assert.equal(plan.schemaVersion, 1)
  assert.ok(plan.schedule.length > 0)
  assert.ok(Object.keys(plan.pillars).length > 0)
})

/* ── date math ────────────────────────────────────────────────────────── */

test("weekIndexForDate returns 0 for rollingStart itself", () => {
  const plan = testPlan()
  assert.equal(weekIndexForDate(plan, plan.meta.rollingStart), 0)
})

test("weekIndexForDate advances every 7 days", () => {
  const plan = testPlan()
  const start = parseDateKey(plan.meta.rollingStart)
  const week1 = toDateKey(new Date(start.getTime() + 7 * 86_400_000))
  assert.equal(weekIndexForDate(plan, week1), 1)
  const week2 = toDateKey(new Date(start.getTime() + 14 * 86_400_000))
  assert.equal(weekIndexForDate(plan, week2), 2)
})

test("isWithinRollingWindow is true inside, false before/after", () => {
  const plan = testPlan()
  assert.equal(isWithinRollingWindow(plan, plan.meta.rollingStart), true)
  const beforeStart = toDateKey(new Date(parseDateKey(plan.meta.rollingStart).getTime() - 86_400_000))
  assert.equal(isWithinRollingWindow(plan, beforeStart), false)
})

/* ── schedule + pillar resolution ──────────────────────────────────────── */

test("getScheduleSlot returns a slot for every weekday in the plan", () => {
  const plan = testPlan()
  const weekdaysWithSlots = new Set(plan.schedule.map((s) => s.weekday))
  // Mon=1, Wed=3, Fri=5, Sat=6, Sun=0 should all be present
  for (const day of [0, 1, 3, 5, 6]) {
    const slot = getScheduleSlot(plan, day)
    assert.ok(slot, `weekday ${day} should have a schedule slot`)
    assert.ok(weekdaysWithSlots.has(day))
  }
  // Tue=2, Thu=4 have no slot
  assert.equal(getScheduleSlot(plan, 2), undefined)
  assert.equal(getScheduleSlot(plan, 4), undefined)
})

test("resolvePillarKey returns every pillar key over 27 weeks", () => {
  const plan = testPlan()
  const seen = new Set<string>()
  const socialSlot = plan.schedule.find((s) => s.slotIndex === 0 && s.kind === "social")!
  for (let w = 0; w < 27; w++) {
    seen.add(resolvePillarKey(plan, socialSlot, w)!)
  }
  assert.equal(seen.size, plan.socialRotation.length, "all 9 pillars should be visited")
  assert.deepStrictEqual([...seen].sort(), [...plan.socialRotation].sort())
})

/* ── computeWindowSlots ────────────────────────────────────────────────── */

test("computeWindowSlots returns 5 slots in a full Mon-Sun week", () => {
  const plan = testPlan()
  // Sep 14 2026 = Monday
  const base = new Date(2026, 8, 14)
  const existing = new Set<string>()
  const counts: TopicCounts = {}
  const slots = computeWindowSlots(plan, base, 7, existing, counts)
  const kinds = slots.map((s) => s.kind)
  assert.deepStrictEqual(kinds, ["social", "social", "social", "social", "blog"])
})

test("computeWindowSlots marks hasDraft = true for existing date keys", () => {
  const plan = testPlan()
  const base = new Date(2026, 8, 14) // Monday
  const existing = new Set<string>(["content-plan:2026-09-14:"])
  const counts: TopicCounts = {}
  const slots = computeWindowSlots(plan, base, 7, existing, counts)
  const target = slots.find((s) => s.dateKey === "2026-09-14")
  assert.ok(target, "slot for 2026-09-14 must be present")
  assert.equal(target.hasDraft, true)
  const other = slots.find((s) => s.dateKey === "2026-09-16")
  assert.ok(other)
  assert.equal(other.hasDraft, false)
})

test("computeWindowSlots does not consume a topic for hasDraft slots", () => {
  const plan = testPlan()
  const base = new Date(2026, 8, 14) // Monday
  const countsNoDraft: TopicCounts = {}
  computeWindowSlots(plan, base, 7, new Set(), countsNoDraft)
  const countsDraft: TopicCounts = {}
  computeWindowSlots(plan, base, 7, new Set(["content-plan:2026-09-14:"]), countsDraft)
  // The Monday social slot was drafted; Wednesday is the first consumed social slot.
  const slotForMonday = plan.schedule.find((s) => s.kind === "social" && s.slotIndex === 0)!
  const pillarForMonday = resolvePillarKey(plan, slotForMonday, weekIndexForDate(plan, "2026-09-14"))
  assert.ok(pillarForMonday)
  // In countsNoDraft, Mon's pillar consumed +1 for topic; in countsDraft, it was skipped.
  assert.ok((countsNoDraft[pillarForMonday] ?? 0) >= 1)
  assert.equal(countsDraft[pillarForMonday] ?? 0, 0, "drafted slot should not consume a topic")
})

test("pendingSlotsOf filters correctly", () => {
  const slots: PlannedSlot[] = [
    { dateKey: "2026-09-14", weekday: 1, kind: "social", platforms: ["facebook"], pillarKey: "a", pillarTitle: "A", topic: "t1", topicIndex: 0, offer: { headline: "h", detail: "d", cta: "c" }, offerIndex: 0, formatHint: "f", slotIndex: 0, hasDraft: true },
    { dateKey: "2026-09-16", weekday: 3, kind: "social", platforms: ["facebook"], pillarKey: "b", pillarTitle: "B", topic: "t2", topicIndex: 0, offer: { headline: "h", detail: "d", cta: "c" }, offerIndex: 0, formatHint: "f", slotIndex: 1, hasDraft: false },
  ]
  const pending = pendingSlotsOf(slots)
  assert.equal(pending.length, 1)
  assert.equal(pending[0].dateKey, "2026-09-16")
})

test("describeSlot returns a readable one-liner", () => {
  const slot: PlannedSlot = {
    dateKey: "2026-09-15", weekday: 2, kind: "blog", platforms: ["facebook", "x"],
    pillarKey: "cost-guides", pillarTitle: "Cost Guides", topic: "3-bedroom cost", topicIndex: 1,
    keyword: "ghana 3 bedroom cost", offer: { headline: "Free estimate", detail: "Try it", cta: "Go" },
    offerIndex: 0, formatHint: "SEO blog", slotIndex: null,
  }
  const desc = describeSlot(slot)
  assert.match(desc, /2026-09-15/)
  assert.match(desc, /blog/)
  assert.match(desc, /Cost Guides/)
})

/* ── topic rotation across weeks ───────────────────────────────────────── */

test("topics advance deterministically week-over-week for a fixed pillar", () => {
  const plan = testPlan()
  const start = parseDateKey(plan.meta.rollingStart)
  const base = new Date(start)
  const existing = new Set<string>()
  const counts: TopicCounts = {}
  const topicSeries: string[] = []

  for (let w = 0; w < 4; w++) {
    const weekBase = new Date(base.getTime() + w * 7 * 86_400_000)
    const slots = computeWindowSlots(plan, weekBase, 7, existing, counts)
    const socials = slots.filter((s) => s.kind === "social")
    topicSeries.push(...socials.map((s) => `${s.pillarKey}:${s.topicIndex}`))
  }

  // At least 16 topic references across 4 weeks (4 socials per week)
  assert.ok(topicSeries.length >= 16)
  // Indices should be strictly non-decreasing per pillar (monotonic advance)
  const pillarFirst: Record<string, number> = {}
  for (const entry of topicSeries) {
    const [pillar, idxStr] = entry.split(":")
    const idx = Number(idxStr)
    if (pillarFirst[pillar] === undefined) pillarFirst[pillar] = idx
    assert.ok(idx >= pillarFirst[pillar], `topic index for ${pillar} must be >= initial ${pillarFirst[pillar]}, got ${idx}`)
    pillarFirst[pillar] = idx
  }
})

/* ── real plan shape checks ────────────────────────────────────────────── */

test("every schedule slot references a rotation key and offer exists", () => {
  const plan = testPlan()
  for (const slot of plan.schedule) {
    const pillarKey = slot.kind === "blog"
      ? plan.blogRotation[weekIndexForDate(plan, plan.meta.rollingStart) % plan.blogRotation.length]
      : plan.socialRotation[(0 * 4 + (slot.slotIndex ?? 0)) % plan.socialRotation.length]
    assert.ok(plan.pillars[pillarKey], `schedule slot references unknown pillar: ${pillarKey}`)
    assert.ok(plan.pillars[pillarKey].topicPool.length >= 5, `pillar ${pillarKey} needs ≥5 topics`)
    assert.ok(plan.pillars[pillarKey].blogKeywords.length >= 1, `pillar ${pillarKey} needs ≥1 blogKeywords`)
  }
  assert.ok(plan.offers.length >= 3, "need ≥3 rotating offers")
})

test("all 9 pillars are represented across 18 weeks of social slots", () => {
  const plan = testPlan()
  const base = parseDateKey(plan.meta.rollingStart)
  const existing = new Set<string>()
  const counts: TopicCounts = {}
  const pillarsSeen = new Set<string>()

  for (let w = 0; w < 18; w++) {
    const weekStart = new Date(base.getTime() + w * 7 * 86_400_000)
    const slots = computeWindowSlots(plan, weekStart, 7, existing, counts)
    for (const s of slots) pillarsSeen.add(s.pillarKey)
  }
  assert.equal(pillarsSeen.size, 9, `expected 9 unique pillars, got ${pillarsSeen.size}: ${[...pillarsSeen].join(",")}`)
})