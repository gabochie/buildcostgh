process.env.AUTH_SECRET = process.env.AUTH_SECRET || "test-csrf-secret"

import { test } from "node:test"
import assert from "node:assert/strict"
import { createCsrfPair, verifyCsrfFromRequest } from "./csrf"

function postWith(cookie: string, header: string | null): Request {
  const headers: Record<string, string> = { cookie: `csrf-token=${cookie}` }
  if (header) headers["x-csrf-token"] = header
  return new Request("https://example.com/api/test", { method: "POST", headers })
}

test("createCsrfPair emits a 3-part signed value", () => {
  const { plain, signed } = createCsrfPair()
  assert.equal(plain.length, 64)
  assert.equal(signed.split(":").length, 3)
})

test("verifyCsrfFromRequest accepts a matching literal-colon cookie", () => {
  const { plain, signed } = createCsrfPair()
  assert.equal(verifyCsrfFromRequest(postWith(signed, plain)), true)
})

test("verifyCsrfFromRequest accepts a percent-encoded cookie (Next.js Set-Cookie)", () => {
  const { plain, signed } = createCsrfPair()
  const encoded = encodeURIComponent(signed)
  assert.ok(encoded.includes("%3A"))
  assert.equal(verifyCsrfFromRequest(postWith(encoded, plain)), true)
})

test("verifyCsrfFromRequest rejects a cookie with no matching header", () => {
  const { signed } = createCsrfPair()
  assert.equal(verifyCsrfFromRequest(postWith(signed, null)), false)
})

test("verifyCsrfFromRequest rejects a mismatched header token", () => {
  const { signed } = createCsrfPair()
  const other = createCsrfPair()
  assert.equal(verifyCsrfFromRequest(postWith(signed, other.plain)), false)
})