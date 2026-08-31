import crypto from "crypto"

const CSRF_SECRET = process.env.AUTH_SECRET || process.env.CSRF_SECRET
const COOKIE_NAME = "csrf-token"
const HEADER_NAME = "x-csrf-token"
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

// The CSRF token is only as strong as its signing secret. Refuse to run in
// production with a missing/fallback secret rather than silently using a
// hardcoded value that would let anyone forge tokens.
if (!CSRF_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("CSRF signing secret missing. Set AUTH_SECRET (or CSRF_SECRET).")
  }
  console.warn("[csrf] No AUTH_SECRET/CSRF_SECRET set — CSRF protection is disabled.")
}

/**
 * Generate a signed CSRF token cookie value.
 * Returns the plain token for the client (include in X-CSRF-Token header).
 * Set the returned signed value as the csrf-token cookie.
 */
export function createCsrfPair(): { plain: string; signed: string } {
  const secret = getCsrfSecret()
  const token = crypto.randomBytes(32).toString("hex")
  const timestamp = Date.now()
  const payload = `${token}:${timestamp}`
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
  return { plain: token, signed: `${payload}:${signature}` }
}

/**
 * Verify a CSRF token from request header against the request cookie.
 * Edge-compatible: uses raw Request object, no next/headers.
 */
export function verifyCsrfFromRequest(request: Request): boolean {
  const secret = CSRF_SECRET
  if (!secret) return false

  const headerToken = request.headers.get(HEADER_NAME)
  if (!headerToken) return false

  // Parse cookie header manually (Edge-compatible)
  const cookieHeader = request.headers.get("cookie") || ""
  const cookies = cookieHeader.split(";").map(c => c.trim())
  const csrfCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`))
  if (!csrfCookie) return false

  const signedValue = csrfCookie.split("=").slice(1).join("=")
  if (!signedValue) return false

  // Parse the signed cookie: token:timestamp:signature
  const parts = signedValue.split(":")
  if (parts.length !== 3) return false
  const [cookieToken, cookieTimestamp, cookieSignature] = parts

  // Verify the cookie's HMAC signature
  const payload = `${cookieToken}:${cookieTimestamp}`
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  if (!timingSafeEqual(cookieSignature, expectedSignature)) return false

  // Check expiry
  if (Date.now() - Number(cookieTimestamp) > TOKEN_EXPIRY_MS) return false

  // Header token must match cookie token
  return timingSafeEqual(headerToken, cookieToken)
}

/**
 * Timing-safe string comparison.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * CSRF guard for API routes. Returns Response if blocked, null if ok.
 * Edge-compatible.
 */
export function csrfGuard(request: Request): Response | null {
  const method = request.method.toUpperCase()

  // Safe methods don't need CSRF protection
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null

  // Skip for auth endpoints (NextAuth has its own CSRF)
  const url = new URL(request.url)
  if (url.pathname.startsWith("/api/auth")) return null

  // Skip for webhooks (verified by HMAC signature)
  if (url.pathname.startsWith("/api/webhook")) return null

  // Skip for API key-authenticated endpoints (v1 API)
  if (url.pathname.startsWith("/api/v1")) return null

  if (!verifyCsrfFromRequest(request)) {
    return new Response(
      JSON.stringify({ error: "CSRF token invalid or missing. Please refresh the page." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }

  return null
}

export { COOKIE_NAME, HEADER_NAME }
