import { NextRequest, NextResponse } from "next/server"
import { runResearchCycle, submitFieldObservations } from "@/lib/research-bot"
import { secureEqual } from "@/lib/secure-compare"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Cron entrypoint for the ResearchBot (Building Cost Research Agent).
 *
 * Runs weekly on Saturdays (see vercel.json — 30 3 * * 6), ahead of the
 * Sunday Content Marketing run. It resolves upcoming content-plan slots,
 * builds evidence briefs from RegionRate rows (+ any field observations
 * posted in the body), and diffs observations into rate proposals.
 *
 * READ-ONLY against business tables: briefs and proposals are returned and
 * logged to AgentLog. Rate changes always need founder approval in the
 * admin Rates tab; only fully-verified briefs are eligible for
 * auto-publishing downstream.
 *
 * Optional POST/GET body: { observations: [{ regionSlug, field, value, source, observedAt }] }
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || !secureEqual(token, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let observations: Parameters<typeof runResearchCycle>[0] = []
  try {
    const body = await req.json()
    if (Array.isArray(body?.observations)) {
      const intake = await submitFieldObservations(body.observations)
      observations = body.observations.slice(0, intake.accepted)
    }
  } catch {
    // No body (plain cron GET) — run on stored rates alone.
  }

  const result = await runResearchCycle(observations)
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error, ts: new Date().toISOString() }, { status: 500 })
  }
  return NextResponse.json({
    ok: true,
    briefs: result.briefs.length,
    autoPublishable: result.autoPublishable,
    proposals: result.proposals.length,
    pending: result.pending,
    detail: result.briefs.map((b) => ({
      slot: b.slotKey,
      topic: b.topic,
      points: b.points.length,
      eligibleForAutoPublish: b.eligibleForAutoPublish,
      quotables: b.quotables,
    })),
    proposalsDetail: result.proposals,
    ts: new Date().toISOString(),
  })
}
