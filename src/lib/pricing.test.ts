import { test } from "node:test"
import assert from "node:assert"
import { getPackagePriceUsd, isPaidPackage, validatePackageAmount } from "./pricing"

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

test("validatePackageAmount accepts amounts within tolerance", async () => {
  const result = await validatePackageAmount("Basic", 29 * 15.5)
  assert.ok(result !== null && result > 0)
  const diff = Math.abs(result - 29 * 15.5) / (29 * 15.5)
  assert.ok(diff < 0.02)
})
