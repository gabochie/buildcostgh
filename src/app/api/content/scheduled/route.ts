import { NextRequest, NextResponse } from "next/server"
import { shouldGenerateDraft, generateContentDraft } from "@/lib/content-engine"
import { secureEqual } from "@/lib/secure-compare"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Vercel Cron entrypoint for the Content Marketing engine.
 *
 * Runs daily (see vercel.json). Generates one draft at most per cadence window
 * (CONTENT_CADENCE_HOURS, default 24) and only drafts — publishing still needs
 * founder approval in the admin Content Marketing queue.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || !secureEqual(token, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (process.env.CONTENT_CRON_ENABLED === "false") {
    return NextResponse.json({ ok: true, skipped: "disabled", ts: new Date().toISOString() })
  }

  const cadenceHours = Number(process.env.CONTENT_CADENCE_HOURS ?? 24) || 24
  const due = await shouldGenerateDraft(cadenceHours)
  if (!due) {
    return NextResponse.json({ ok: true, generated: false, reason: "not_due", ts: new Date().toISOString() })
  }

  const result = await generateContentDraft()
  if (!result.draft) {
    return NextResponse.json(
      { ok: false, error: result.error ?? "Generation failed", ts: new Date().toISOString() },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true, generated: true, draft: result.draft, ts: new Date().toISOString() })
}
