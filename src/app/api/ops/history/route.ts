import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { getAgentLogs } from "@/lib/agent-log"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { logs } = await getAgentLogs({ agent: "OpsWatchtower", limit: 15 })

  return NextResponse.json({
    runs: logs.map((l) => ({
      id: l.id,
      level: l.level,
      action: l.action,
      createdAt: l.createdAt,
      details: l.details,
    })),
  })
}