import { test } from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"
import { secureEqual, verifyHmacSignature } from "./secure-compare"

const SECRET = "sk_test_supersecret"

function sign(body: string, secret = SECRET): string {
  return crypto.createHmac("sha512", secret).update(body).digest("hex")
}

test("verifyHmacSignature accepts a valid signature", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: "BCG-1" } })
  const signature = sign(body)
  assert.equal(verifyHmacSignature(SECRET, body, signature), true)
})

test("verifyHmacSignature rejects a tampered body", () => {
  const body = JSON.stringify({ event: "charge.success", data: { reference: "BCG-1" } })
  const signature = sign(body)
  const tampered = body.replace("BCG-1", "BCG-2")
  assert.equal(verifyHmacSignature(SECRET, tampered, signature), false)
})

test("verifyHmacSignature rejects a signature from a different secret", () => {
  const body = JSON.stringify({ event: "charge.success" })
  const signature = sign(body, "sk_test_wrong")
  assert.equal(verifyHmacSignature(SECRET, body, signature), false)
})

test("verifyHmacSignature rejects a missing signature", () => {
  const body = JSON.stringify({ event: "charge.success" })
  assert.equal(verifyHmacSignature(SECRET, body, undefined), false)
})

test("verifyHmacSignature rejects when secret is empty", () => {
  const body = JSON.stringify({ event: "charge.success" })
  const signature = sign(body)
  assert.equal(verifyHmacSignature("", body, signature), false)
})

test("verifyHmacSignature is sha512 by default and accepts sha256", () => {
  const body = "payload"
  const sha512Sig = crypto.createHmac("sha512", SECRET).update(body).digest("hex")
  const sha256Sig = crypto.createHmac("sha256", SECRET).update(body).digest("hex")
  assert.equal(verifyHmacSignature(SECRET, body, sha512Sig), true)
  assert.equal(verifyHmacSignature(SECRET, body, sha256Sig, "sha256"), true)
  // sha512 signature must NOT validate as sha256
  assert.equal(verifyHmacSignature(SECRET, body, sha512Sig, "sha256"), false)
})

test("secureEqual returns true for identical strings", () => {
  assert.equal(secureEqual("hunter2", "hunter2"), true)
})

test("secureEqual returns false for different strings", () => {
  assert.equal(secureEqual("hunter2", "hunter3"), false)
  assert.equal(secureEqual("a", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"), false)
})

test("secureEqual returns false when either side is undefined", () => {
  assert.equal(secureEqual(undefined, "hunter2"), false)
  assert.equal(secureEqual("hunter2", undefined), false)
  assert.equal(secureEqual(undefined, undefined), false)
})

test("secureEqual handles empty strings", () => {
  assert.equal(secureEqual("", ""), true)
  assert.equal(secureEqual("", "x"), false)
})
