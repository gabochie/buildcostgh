import crypto from "node:crypto"

/**
 * Timing-safe string equality.
 *
 * Plain `===` on secrets (passwords, cron tokens) leaks timing information
 * that enables remote guessing. Compare SHA-256 digests with
 * `timingSafeEqual` instead. A constant-time compare means an attacker
 * cannot tell how many leading characters matched.
 */
export function secureEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (a === undefined || a === null || b === undefined || b === null) return false
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest()
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest()
  return crypto.timingSafeEqual(hashA, hashB)
}

/**
 * Verify an HMAC signature (e.g. Paystack webhook `x-paystack-signature`)
 * in constant time.
 *
 * Both digests are hex-encoded strings of equal length when the signature
 * is well-formed. Lengths are checked before `timingSafeEqual` because the
 * latter throws on mismatched buffer lengths.
 */
export function verifyHmacSignature(
  secret: string,
  body: string | Buffer,
  signature: string | null | undefined,
  algorithm: "sha256" | "sha512" = "sha512"
): boolean {
  if (!signature || !secret) return false

  const expected = crypto.createHmac(algorithm, secret).update(body).digest("hex")
  const expectedBuf = Buffer.from(expected, "utf8")
  const receivedBuf = Buffer.from(signature, "utf8")

  if (expectedBuf.length !== receivedBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, receivedBuf)
}
