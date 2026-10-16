import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { apiRateLimit } from "@/lib/rate-limit"
import { sendEmail, isEmailConfigured, type EmailChannel } from "@/lib/email-send"
import { z } from "zod"

export const dynamic = "force-dynamic"

const testSchema = z.object({
  to: z.string().email().max(320),
  channel: z.enum(["resend-sdk", "resend-http", "smtp"]).optional(),
})

// POST /api/admin/email-test — send a test email via the unified sender.
// Admin-only. Verifies a specific channel (forceChannel) or the full
// fallback chain. Used for fallback drills and debugging delivery.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rateLimit = await apiRateLimit(req, { maxRequests: 10, path: "admin-email-test" })
  if (!rateLimit.ok) return rateLimit.response!

  const parsed = testSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "a valid `to` email is required" }, { status: 400 })
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { ok: false, error: "no email channel configured (RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD)" },
      { status: 503 },
    )
  }

  const result = await sendEmail({
    to: parsed.data.to,
    subject: "BuildCost GH email test",
    html: `<p>This is a test email from BuildCost GH (channel: ${parsed.data.channel || "auto"}).</p><p>If you received this, delivery works.</p>`,
    forceChannel: parsed.data.channel as EmailChannel | undefined,
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
