import { test, mock } from "node:test"
import assert from "node:assert"
import { getPackagePriceUsd, isPaidPackage, validatePackageAmount } from "./pricing"
import { resetGhsRateCache } from "./currency"

test("package prices are known for paid tiers", () => {
  assert.strictEqual(getPackagePriceUsd("Basic"), 29)
  assert.strictEqual(getPackagePriceUsd("Detailed"), 79)
  assert.strictEqual(getPackagePriceUsd("Premium"), 199)
  assert.strictEqual(getPackagePriceUsd("Free Trial"), 0)
  assert.strictEqual(getPackagePriceUsd("Unknown"), 0)
})

test("isPaidPackage identifies paid tiers only", () => {
  assert.strictEqual(isPaidPackage("Basic"), true)
  assert.strictEqual(isPaidPackage("Detailed"), true)
  assert.strictEqual(isPaidPackage("Premium"), true)
  assert.strictEqual(isPaidPackage("Free Trial"), false)
})

test("validatePackageAmount rejects tampered amounts", async () => {
  const result = await validatePackageAmount("Basic", 1)
  assert.strictEqual(result, null)
})

test("validatePackageAmount rejects unknown packages", async () => {
  const result = await validatePackageAmount("NotAPackage", 1000)
  assert.strictEqual(result, null)
})

test("validatePackageAmount accepts amounts within tolerance of the live rate", async () => {
  // Pin the rate source so the test is deterministic and independent of network state.
  resetGhsRateCache()
  const mockFetch = mock.method(globalThis, "fetch", async () => {
    return {
      ok: true,
      json: async () => ({ result: "success", time_last_update_utc: "2026-08-09 00:00:00 +0000", rates: { GHS: 11.76 } }),
    }
  })

  try {
    const expected = Math.round(29 * 11.76)
    const result = await validatePackageAmount("Basic", expected)
    assert.ok(result !== null && result > 0)
    assert.strictEqual(result, expected)
    assert.ok(mockFetch.mock.callCount() >= 1)
  } finally {
    mockFetch.mock.restore()
  }
})
