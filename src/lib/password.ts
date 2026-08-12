import crypto from "node:crypto"

/**
 * Password hashing using Node's built-in scrypt — no external dependencies.
 * Stored format: `<saltHex>:<hashHex>` where hash is a 64-byte scrypt digest.
 *
 * scrypt is memory-hard (N=16384, r=8, p=1) and resistant to GPU/ASIC
 * brute-force, which makes it a good fit for a serverless environment where
 * native bcrypt modules are a deployment headache.
 */

const SCRYPT_KEYLEN = 64
const SCRYPT_OPTIONS: crypto.ScryptOptions = { N: 16384, r: 8, p: 1 }

const scryptAsync = (password: string, salt: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })

/** Hash a plaintext password into the `salt:hash` storage format. */
export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = await scryptAsync(plain, salt)
  return `${salt}:${hash.toString("hex")}`
}

/** Verify a plaintext password against a stored `salt:hash` value. */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(":")
  if (!salt || !hashHex) return false

  const expected = Buffer.from(hashHex, "hex")
  const actual = await scryptAsync(plain, salt)

  if (actual.length !== expected.length) return false
  return crypto.timingSafeEqual(actual, expected)
}
