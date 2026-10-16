import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { captureError } from "@/lib/observe"

export const dynamic = "force-dynamic"

/**
 * Readiness probe — verifies the app can actually serve traffic
 * (DB reachable, queue queryable). Heavier than /live; used by the
 * deploy smoke gate and the Ops Watchtower. Never leaks DB internals.
 */
export async function GET() {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    const dbLatency = Date.now() - start

    const [pendingJobs, failedJobs] = await Promise.all([
      prisma.job.count({ where: { status: "pending" } }).catch(() => -1),
      prisma.job.count({ where: { status: "failed" } }).catch(() => -1),
    ])

    return NextResponse.json({
      status: "ready",
      timestamp: new Date().toISOString(),
      db: { connected: true, latencyMs: dbLatency },
      queue: { pending: pendingJobs, failed: failedJobs },
    })
  } catch (err) {
    console.error("[health/ready] DB check failed", err)
    await captureError(err, { scope: "health/ready" })
    return NextResponse.json(
      {
        status: "not-ready",
        timestamp: new Date().toISOString(),
        db: { connected: false },
      },
      { status: 503 },
    )
  }
}
