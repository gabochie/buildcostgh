import { test } from "node:test"
import assert from "node:assert/strict"
import {
  buildBriefForSlot,
  classifyConfidence,
  fieldsForPillar,
  isAutoPublishEligible,
  proposeRateUpdates,
  type FieldObservation,
  type RateRow,
} from "./research-brief"

const NOW = new Date("2026-09-25T00:00:00Z")
const RECENT = new Date("2026-09-01T00:00:00Z").toISOString()
const OLD = new Date("2024-01-01T00:00:00Z").toISOString()

function row(overrides: Partial<RateRow> = {}): RateRow {
  return {
    slug: "greater-accra",
    name: "Greater Accra",
    capital: "Accra",
    source: "Supplier survey + NPA benchmark, Aug 2026",
    updatedAt: RECENT,
    multiplier: 1,
    labourRate: 130,
    cementBag: 105,
    rebarTon: 9800,
    block: 13,
    sandTrip: 700,
    graniteTrip: 850,
    timber: 35,
    roofingSqm: 65,
    dieselLit: 17,
    paintLit: 140,
    ...overrides,
  }
}

/* ── confidence ─────────────────────────────────────────────────────────── */

test("classifyConfidence: no sources → estimated", () => {
  assert.equal(classifyConfidence([], [], NOW), "estimated")
})

test("classifyConfidence: two distinct recent sources → verified", () => {
  assert.equal(classifyConfidence(["Kantamanto wholesale", "Adum market call"], [RECENT, RECENT], NOW), "verified")
})

test("classifyConfidence: single recent source → single-source", () => {
  assert.equal(classifyConfidence(["Kantamanto wholesale"], [RECENT], NOW), "single-source")
})

test("classifyConfidence: stale sources never verify", () => {
  assert.equal(classifyConfidence(["Old survey", "Older survey"], [OLD, OLD], NOW), "single-source")
  assert.equal(classifyConfidence(["Old survey"], [OLD], NOW), "estimated")
})

/* ── briefs ─────────────────────────────────────────────────────────────── */

test("buildBriefForSlot maps pillar fields and quotes cheapest vs priciest", () => {
  const kumasi = row({ slug: "ashanti", name: "Ashanti", capital: "Kumasi", cementBag: 96, updatedAt: RECENT })
  const brief = buildBriefForSlot(
    { dateKey: "2026-10-01", pillarKey: "materials-prices", topic: "Cement price" },
    [row(), kumasi],
    [],
    NOW
  )
  const cement = brief.points.find((p) => p.field === "cementBag")
  assert.ok(cement, "cement point exists")
  assert.equal(cement.regions.length, 2)
  // Same source string on both rows dedupes to one → single-source, not auto-publishable
  assert.equal(cement.confidence, "single-source")
  assert.equal(brief.eligibleForAutoPublish, false)
  assert.ok(brief.quotables.length > 0)
  assert.match(brief.quotables[0], /Ashanti/)
})

test("field observation corroboration lifts a point to verified", () => {
  const accra = row({ source: "Supplier survey, Aug 2026", updatedAt: RECENT })
  const kumasi = row({ slug: "ashanti", name: "Ashanti", capital: "Kumasi", source: "Adum market call, Sep 2026", cementBag: 96, updatedAt: RECENT })
  const brief = buildBriefForSlot(
    { dateKey: "2026-10-01", pillarKey: "materials-prices", topic: "Cement price" },
    [accra, kumasi],
    [],
    NOW
  )
  const cement = brief.points.find((p) => p.field === "cementBag")
  assert.equal(cement?.confidence, "verified")
})

test("isAutoPublishEligible requires points and all-verified", () => {
  assert.equal(isAutoPublishEligible({ points: [] }), false)
  assert.equal(
    isAutoPublishEligible({ points: [{ confidence: "verified" }, { confidence: "single-source" }] as never }),
    false
  )
  assert.equal(isAutoPublishEligible({ points: [{ confidence: "verified" }] as never }), true)
})

test("fieldsForPillar falls back for unknown pillars", () => {
  assert.deepEqual(fieldsForPillar("nope"), ["cementBag", "multiplier", "labourRate"])
  assert.ok(fieldsForPillar("stage-budgets").includes("paintLit"))
})

/* ── proposals ──────────────────────────────────────────────────────────── */

test("proposeRateUpdates diffs only real changes with evidence", () => {
  const obs: FieldObservation[] = [
    { regionSlug: "greater-accra", field: "cementBag", value: 112, source: "Kantamanto call, Sep 2026", observedAt: RECENT },
    { regionSlug: "greater-accra", field: "block", value: 13, source: "same", observedAt: RECENT },
    { regionSlug: "unknown-region", field: "cementBag", value: 1, source: "x", observedAt: RECENT },
  ]
  const proposals = proposeRateUpdates([row()], obs, NOW)
  assert.equal(proposals.length, 1)
  assert.equal(proposals[0].oldValue, 105)
  assert.equal(proposals[0].proposedValue, 112)
  assert.equal(proposals[0].changePct, 6.7)
  assert.ok(proposals[0].evidence.includes("Kantamanto call, Sep 2026"))
})
