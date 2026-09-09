import { NextRequest, NextResponse } from "next/server"
import { shouldGenerateDraft, generateContentDraft } from "@/lib/content-engine"
import { loadContentPlan } from "@/lib/content-plan"
import { runPlanBatch } from "@/lib/content-planner"
import { secureEqual } from "@/lib/secure-compare"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Vercel Cron entrypoint for the Content Marketing engine.
 *
 * Runs daily (see vercel.json). When the 1-year Content Plan
 * (content/content-plan.json) is present, each run fills the upcoming plan
 * slots that still need a draft (up to CONTENT_PLAN_DRAFTS_PER_RUN, default 2)
 * until the week is complete — deterministic topics, pillars, and offers from
 * the plan file. Without a plan it falls back to the legacy single-draft
 * cadence engine (CONTENT_CADENCE_HOURS, default 24).
 *
 * Drafts are NEVER published automatically — founder approval in the admin
 * Content Marketing queue is always required.
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

  const plan = loadContentPlan()
  if (plan) {
    const result = await runPlanBatch(plan)
    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error, ts: new Date().toISOString() }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      mode: "plan",
      generated: result.generated,
      pending: result.pending,
      slots: result.slots.map((s) => ({
        date: s.dateKey,
        kind: s.kind,
        pillar: s.pillarKey,
        topic: s.topic,
      })),
      ts: new Date().toISOString(),
    })
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

  return NextResponse.json({ ok: true, mode: "legacy", generated: true, draft: result.draft, ts: new Date().toISOString() })
}