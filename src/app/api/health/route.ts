import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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
      status: "healthy",
      timestamp: new Date().toISOString(),
      db: { connected: true, latencyMs: dbLatency },
      queue: { pending: pendingJobs, failed: failedJobs },
      uptime: process.uptime(),
    })
  } catch (err) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      db: { connected: false, error: err instanceof Error ? err.message : String(err) },
    }, { status: 503 })
  }
}
