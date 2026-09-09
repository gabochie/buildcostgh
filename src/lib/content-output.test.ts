import { test } from "node:test"
import assert from "node:assert/strict"
import {
  parseDraftOutputs,
  slugifyTitle,
  blogCategoryFor,
  estimateReadTime,
  planDateForSource,
} from "./content-output"

test("parseDraftOutputs parses a batch array in order", () => {
  const text = `
Here you go:
[
  { "kind": "social", "title": "First", "caption": "Cap one", "body": null, "offer": { "headline": "H1", "cta": "Go" }, "platforms": ["facebook", "x"], "imagePrompt": "A house in Accra", "tags": ["cost"] },
  { "kind": "blog", "title": "Second", "caption": "Cap two", "body": "Long body", "offer": { "headline": "H2", "cta": "Buy" }, "platforms": ["linkedin"] }
]`
  const parsed = parseDraftOutputs(text)
  assert.ok(parsed)
  assert.equal(parsed.length, 2)
  assert.equal(parsed[0].title, "First")
  assert.equal(parsed[0].kind, "social")
  assert.equal(parsed[0].imagePrompt, "A house in Accra")
  assert.deepEqual(parsed[0].platforms, ["facebook", "x"])
  assert.equal(parsed[1].kind, "blog")
  assert.equal(parsed[1].body, "Long body")
})

test("parseDraftOutputs handles a single legacy object", () => {
  const parsed = parseDraftOutputs(`{"kind":"social","title":"Legacy","caption":"c","offer":{"headline":"h"},"platforms":["x"]}`)
  assert.ok(parsed)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].title, "Legacy")
})

test("parseDraftOutputs returns null on unparseable text", () => {
  assert.equal(parseDraftOutputs("not json at all"), null)
  assert.equal(parseDraftOutputs('[{"kind":"social"'), null)
  assert.equal(parseDraftOutputs(""), null)
})

test("parseDraftOutputs drops malformed items but keeps the rest", () => {
  const parsed = parseDraftOutputs('[{"kind":"social","title":"A","caption":"1","offer":{},"platforms":[]},  "junk", {"kind":"social","title":"B","caption":"2","offer":{},"platforms":[]}]')
  assert.ok(parsed)
  assert.equal(parsed.length, 2)
  assert.equal(parsed[0].title, "A")
  assert.equal(parsed[1].title, "B")
})

test("slugifyTitle produces an ascii slug", () => {
  assert.equal(slugifyTitle("How Much Does a 4-Bedroom House Cost in Ghana?"), "how-much-does-a-4-bedroom-house-cost-in-ghana")
  assert.equal(slugifyTitle("Cement Prices: What's Changing?"), "cement-prices-whats-changing")
  assert.equal(slugifyTitle("!!!"), "post")
})

test("blogCategoryFor keeps the pillar key as category", () => {
  assert.equal(blogCategoryFor("cost-guides"), "cost-guides")
})

test("estimateReadTime rounds words to minutes", () => {
  assert.equal(estimateReadTime(null), 0)
  assert.equal(estimateReadTime("a ".repeat(200)), 1)
  assert.equal(estimateReadTime("word ".repeat(600)), 3)
  assert.equal(estimateReadTime("word ".repeat(10)), 1)
})

test("planDateForSource extracts the plan date", () => {
  assert.equal(planDateForSource("content-plan:2026-09-14:cost-guides:0")?.toISOString().slice(0, 10), "2026-09-14")
  assert.equal(planDateForSource("content-agent"), null)
  assert.equal(planDateForSource("content-plan:not-a-date:x:0"), null)
  assert.equal(planDateForSource(null), null)
})