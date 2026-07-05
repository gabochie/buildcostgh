import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/maintenance", "/api/maintenance-status", "/_next", "/favicon.ico", "/assets"]

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  try {
    const res = await fetch(new URL("/api/maintenance-status", req.url), {
      headers: { "Cache-Control": "no-cache" },
    })
    const { enabled } = await res.json()

    if (enabled) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
      }
      return NextResponse.redirect(new URL("/maintenance", req.url))
    }
  } catch {}

  const token = await getToken({ req })
  const protectedPaths = ["/dashboard", "/admin"]
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isProtected && !token) {
    const signInUrl = new URL("/admin", req.nextUrl)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
}
