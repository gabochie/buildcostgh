import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import { verifyCsrfFromRequest } from "@/lib/csrf"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ""

// Paths that never need maintenance/auth/CSRF interception
const BYPASS_PATHS = ["/maintenance", "/api/maintenance-status", "/api/admin/maintenance", "/admin/login", "/_next", "/favicon.ico", "/assets"]

const adminPaths = ["/admin"]
const dashboardPaths = ["/dashboard"]

function matchPaths(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"))
}

// Static assets, internals, and auth endpoints must never be intercepted
function skipProxy(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhook") ||
    pathname.includes(".")
  )
}

// CSRF check for state-changing API routes (POST/PUT/DELETE/PATCH).
// Skips: GET/HEAD/OPTIONS, auth endpoints, webhooks, v1 API (key-auth).
function checkCsrf(request: NextRequest): Response | null {
  const method = request.method.toUpperCase()
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null

  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api/auth")) return null
  if (pathname.startsWith("/api/webhook")) return null
  if (pathname.startsWith("/api/v1")) return null

  if (!verifyCsrfFromRequest(request)) {
    return NextResponse.json(
      { error: "CSRF token invalid or missing. Please refresh the page." },
      { status: 403 }
    )
  }

  return null
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (BYPASS_PATHS.some((p) => pathname.startsWith(p)) || skipProxy(pathname)) {
    return NextResponse.next()
  }

  // Maintenance mode check — block public pages and API, allow admin through.
  // Never let the maintenance check hang a request (cold DB, etc.).
  try {
    const res = await fetch(new URL("/api/maintenance-status", req.url), {
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(2000),
    })
    const { enabled } = await res.json()

    if (enabled && !pathname.startsWith("/admin")) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
      }
      return NextResponse.redirect(new URL("/maintenance", req.url))
    }
  } catch {}

  // CSRF protection on state-changing API routes
  if (pathname.startsWith("/api/")) {
    const csrfResult = checkCsrf(req)
    if (csrfResult) return csrfResult
  }

  // Decode the session from the auth cookie. getToken() parses
  // Authorization: Bearer as a JWT and throws on non-JWT tokens (e.g. Vercel
  // Cron's CRON_SECRET) — gate it so requests never crash.
  let token: Awaited<ReturnType<typeof getToken>> = null
  try {
    token = await getToken({ req })
  } catch {
    token = null
  }

  // Admin subpages: require an authenticated super-admin
  if (matchPaths(pathname, adminPaths) && pathname !== "/admin") {
    if (!token) {
      return NextResponse.redirect(new URL("/admin", req.url))
    }
    if (token.email && token.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
    return NextResponse.next()
  }

  // Dashboard routes require login
  if (matchPaths(pathname, dashboardPaths)) {
    if (!token) {
      const url = new URL("/admin", req.nextUrl)
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
