import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { publishAllApproved } from "@/lib/social"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Batch publish approved content drafts.
 *
 * POST /api/content/publish
 * Body: { draftIds?: string[] } — when `draftIds` is supplied, only those
 * drafts are published; otherwise every approved-but-unpublished draft is
 * published (capped at 50 per call).
 *
 * Each publish is idempotent: already-published drafts are not touched. The
 * response includes a per-draft breakdown so the admin can see which posts
 * landed and which need manual attention.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: Record<string, unknown> | null = null
  try {
    const raw = await request.text()
    body = raw ? JSON.parse(raw) : null
  } catch {
    body = null
  }

  const draftIds = Array.isArray(body?.draftIds) ? body!.draftIds.filter((id): id is string => typeof id === "string") : undefined

  try {
    const result = await publishAllApproved({ draftIds })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  }
}
