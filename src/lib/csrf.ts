import crypto from "crypto"
import { cookies } from "next/headers"

const CSRF_SECRET = process.env.AUTH_SECRET || process.env.CSRF_SECRET || "buildcostgh-csrf-fallback"
const COOKIE_NAME = "csrf-token"
const HEADER_NAME = "x-csrf-token"
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 hour

/**
 * Generate a signed CSRF token and set it as an httpOnly cookie.
 * Returns the plain token to send to the client (via header or meta tag).
 */
export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const timestamp = Date.now()
  const payload = `${token}:${timestamp}`
  const signature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(payload)
    .digest("hex")
  const signedToken = `${payload}:${signature}`

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, signedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: TOKEN_EXPIRY_MS / 1000,
  })

  return token
}

/**
 * Verify a CSRF token from the request header against the signed cookie.
 * Returns true if valid, false otherwise.
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies()
  const signedCookie = cookieStore.get(COOKIE_NAME)?.value
  if (!signedCookie) return false

  const headerToken = request.headers.get(HEADER_NAME)
  if (!headerToken) return false

  // Parse the signed cookie: token:timestamp:signature
  const cookieParts = signedCookie.split(":")
  if (cookieParts.length !== 3) return false
  const [cookieToken, cookieTimestamp, cookieSignature] = cookieParts

  // Verify the cookie's signature
  const payload = `${cookieToken}:${cookieTimestamp}`
  const expectedSignature = crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(payload)
    .digest("hex")

  if (!timingSafeEqual(cookieSignature, expectedSignature)) return false

  // Check expiry
  if (Date.now() - Number(cookieTimestamp) > TOKEN_EXPIRY_MS) return false

  // The header token must match the cookie token
  return timingSafeEqual(headerToken, cookieToken)
}

/**
 * Timing-safe string comparison to prevent timing attacks.
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Middleware helper: returns 403 Response if CSRF check fails, null if ok.
 * Skips GET/HEAD/OPTIONS (safe methods) and same-origin requests.
 */
export async function csrfGuard(request: Request): Promise<Response | null> {
  const method = request.method.toUpperCase()

  // Safe methods don't need CSRF protection
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null
  }

  // Skip CSRF for NextAuth endpoints (they have their own protection)
  const url = new URL(request.url)
  if (url.pathname.startsWith("/api/auth")) return null

  // Skip CSRF for webhook endpoints (verified by signature)
  if (url.pathname.startsWith("/api/webhook")) return null

  // Verify CSRF token
  const valid = await verifyCsrfToken(request)
  if (!valid) {
    return new Response(
      JSON.stringify({ error: "CSRF token invalid or missing. Please refresh the page." }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    )
  }

  return null
}
