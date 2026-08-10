import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const BYPASS_PATHS = ["/maintenance", "/api/maintenance-status", "/api/admin/maintenance", "/admin/login", "/_next", "/favicon.ico", "/assets"]

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (BYPASS_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Maintenance mode check — block public pages and API, allow admin through
  try {
    const res = await fetch(new URL("/api/maintenance-status", req.url), {
      headers: { "Cache-Control": "no-cache" },
      // Never let the maintenance check hang a request (cold DB, etc.)
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

  // Auth protection — only /dashboard needs proxy protection
  // /admin handles auth itself (shows sign-in button client-side)
  const isProtected = pathname === "/dashboard" || pathname.startsWith("/dashboard/")

  if (isProtected) {
    // getToken() parses Authorization: Bearer as a JWT and throws on non-JWT
    // tokens (Vercel Cron sends CRON_SECRET) - gate it so API routes never crash.
    let token: Awaited<ReturnType<typeof getToken>> = null
    try {
      token = await getToken({ req })
    } catch {
      token = null
    }
    if (!token) {
      const signInUrl = new URL("/admin", req.nextUrl)
      signInUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(signInUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
