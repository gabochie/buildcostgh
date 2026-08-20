import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { verifyCsrfFromRequest } from "@/lib/csrf"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "gabochie@gmail.com"

// ── Route matchers ──
const dashboardPaths = ["/dashboard"]
const adminPaths = ["/admin"]

function matchPaths(pathname: string, paths: string[]): boolean {
  return paths.some(p => pathname === p || pathname.startsWith(p + "/"))
}

// Static assets, internals, and auth endpoints must never be intercepted
function skipMiddleware(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhook") ||
    pathname.includes(".")
  )
}

async function getSessionFromCookie(request: NextRequest): Promise<{ email?: string } | null> {
  const token =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value

  if (!token) return null

  try {
    const secret = process.env.AUTH_SECRET
    if (!secret) return null

    const encoder = new TextEncoder()
    const key = encoder.encode(secret)
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] })
    return { email: payload.email as string | undefined }
  } catch {
    return null
  }
}

/**
 * CSRF check for state-changing API routes (POST/PUT/DELETE/PATCH).
 * Skips: GET/HEAD/OPTIONS, auth endpoints, webhooks, v1 API (key-auth).
 */
function checkCsrf(request: NextRequest): Response | null {
  const method = request.method.toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null

  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api/auth")) return null
  if (pathname.startsWith("/api/webhook")) return null
  if (pathname.startsWith("/api/v1")) return null

  if (!verifyCsrfFromRequest(request)) {
    return new Response(
      JSON.stringify({ error: "CSRF token invalid or missing. Please refresh the page." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    )
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (skipMiddleware(pathname)) {
    return NextResponse.next()
  }

  // ── CSRF protection on state-changing API routes ──
  if (pathname.startsWith("/api/")) {
    const csrfResult = checkCsrf(request)
    if (csrfResult) return csrfResult
  }

  const session = await getSessionFromCookie(request)
  const isLoggedIn = !!session

  // ── Admin routes ──
  if (matchPaths(pathname, adminPaths)) {
    if (pathname === "/admin") return NextResponse.next()

    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    if (session.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  }

  // ── Dashboard routes ──
  if (matchPaths(pathname, dashboardPaths)) {
    if (!isLoggedIn) {
      const url = new URL("/login", request.url)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── Public routes ──
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
