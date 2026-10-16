import { NextRequest, NextResponse } from "next/server"
import { getQueueStats, processJobQueue } from "@/lib/queue"
import { processExpiredSubscriptions } from "@/lib/subscriptions"
import { secureEqual } from "@/lib/secure-compare"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Vercel Cron entrypoint: drains the DB-backed job queue.
 *
 * Previously nothing processed enqueued jobs automatically — failed report
 * generation / receipt sends sat in the queue forever unless an admin
 * manually hit /api/jobs/enqueue with type "process_queue".
 *
 * Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` (the value of the
 * CRON_SECRET env var). Any other caller gets 401.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || !secureEqual(token, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Cap per-invocation work so the function stays within platform limits;
  // remaining jobs are picked up on the next tick.
  try {
    const processed = await processJobQueue(5)
    const stats = await getQueueStats()

    // Daily subscription maintenance: expire lapsed "active" subscriptions and
    // nudge non-cancelled members to renew.
    const subs = await processExpiredSubscriptions()

    return NextResponse.json({
      ok: true,
      processed,
      queue: stats,
      subscriptions: subs,
      ts: new Date().toISOString(),
    })
  } catch (err) {
    // Never leak internals (message/code/meta/stack can embed SQL, paths,
    // or secrets) to the caller — log server-side, return a generic 500.
    console.error("[jobs/process] queue drain failed", err)
    return NextResponse.json({ error: "Job processing failed" }, { status: 500 })
  }
}
