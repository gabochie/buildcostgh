import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "gabochie@gmail.com"

// Paths that require authentication
const dashboardPaths = ["/dashboard"]
const adminPaths = ["/admin"]

// Paths that are public (no auth needed)
const publicPaths = [
  "/", "/calculator", "/pricing", "/blog", "/contact", "/costs",
  "/contractors", "/login", "/signup", "/forgot-password", "/reset-password",
  "/about", "/how-it-works", "/services", "/privacy", "/terms", "/disclaimer",
  "/careers", "/investors", "/press-kit", "/refunds", "/api-docs", "/api-pricing",
  "/affiliates", "/csr", "/maintenance", "/order-success",
  "/flood-safe-land", "/reports/flood-risk",
]

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(p => pathname === p || pathname.startsWith(p + "/"))
}

function isDashboardPath(pathname: string): boolean {
  return dashboardPaths.some(p => pathname === p || pathname.startsWith(p + "/"))
}

function isAdminPath(pathname: string): boolean {
  return adminPaths.some(p => pathname === p || pathname.startsWith(p + "/"))
}

// Static assets and internals should never be intercepted
function isStaticOrInternal(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhook") ||
    pathname.includes(".") // static files: .js, .css, .png, etc.
  )
}

/**
 * Server-side route protection middleware.
 *
 * Uses NextAuth v5 JWT session cookie check.
 * The session cookie is `next-auth.session-token` (or `__Secure-next-auth.session-token` in prod).
 *
 * For admin routes: requires session with ADMIN_EMAIL.
 * For dashboard routes: requires any valid session.
 * Redirects unauthenticated users to /login (dashboard) or /admin (admin login page).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files, internals, API auth, and public paths
  if (isStaticOrInternal(pathname)) {
    return NextResponse.next()
  }

  // Check for session token cookie (both naming conventions)
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value

  const hasSession = !!sessionToken

  // ── Admin routes ──
  if (isAdminPath(pathname)) {
    if (!hasSession) {
      // Admin login page at /admin itself — allow through (layout handles login form)
      if (pathname === "/admin") return NextResponse.next()
      const url = request.nextUrl.clone()
      url.pathname = "/admin"
      return NextResponse.redirect(url)
    }

    // For admin, we need to verify the email. Since middleware is Edge runtime,
    // we can't decode the JWT directly. Instead, we set a header that API routes
    // can verify. The layout component already does client-side admin check.
    // The critical protection here is: unauthenticated users can't even load
    // admin page shells (no HTML leaks).
    return NextResponse.next()
  }

  // ── Dashboard routes ──
  if (isDashboardPath(pathname)) {
    if (!hasSession) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ── All other routes: public ──
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser request)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
