import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const agents = ["PaymentBot", "ReportBot", "LeadBot", "PriceBot", "SupportBot", "MCP"]

  const stats = await Promise.all(
    agents.map(async (agent) => {
      const [lastLog, actionCount, errorCount] = await Promise.all([
        prisma.agentLog.findFirst({
          where: { agent },
          orderBy: { createdAt: "desc" },
          select: { action: true, createdAt: true, level: true },
        }),
        prisma.agentLog.count({ where: { agent } }),
        prisma.agentLog.count({ where: { agent, level: "error" } }),
      ])

      const now = Date.now()
      const lastSeen = lastLog?.createdAt?.getTime() || 0
      const minutesSinceLastSeen = lastSeen ? Math.round((now - lastSeen) / 60000) : null

      let status: string
      if (errorCount > 5) status = "error"
      else if (!lastLog) status = "idle"
      else if (minutesSinceLastSeen !== null && minutesSinceLastSeen > 60) status = "idle"
      else status = "active"

      return {
        name: agent,
        status,
        totalActions: actionCount,
        errors: errorCount,
        lastAction: lastLog?.action || null,
        lastSeen: lastLog?.createdAt?.toISOString() || null,
        minutesSinceLastSeen,
      }
    })
  )

  return NextResponse.json(stats)
}
