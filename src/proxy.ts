import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

  const protectedPaths = ["/dashboard", "/admin"]
  const isProtected = protectedPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isProtected && !token) {
    const signInUrl = new URL("/admin", req.nextUrl)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
}
