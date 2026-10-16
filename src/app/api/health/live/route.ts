import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Liveness probe — cheap, unauthenticated, no internals.
 * Deploy gates, load balancers, and uptime monitors hit this.
 * Must never touch the database or expose queue state.
 */
export async function GET() {
  return NextResponse.json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
}
