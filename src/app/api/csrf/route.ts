import { NextResponse } from "next/server"
import { createCsrfPair, COOKIE_NAME } from "@/lib/csrf"

export async function GET() {
  const { plain, signed } = createCsrfPair()

  const response = NextResponse.json({ csrfToken: plain })
  response.cookies.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600, // 1 hour
  })

  return response
}
