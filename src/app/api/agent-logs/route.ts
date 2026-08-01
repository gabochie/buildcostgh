import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200)
  const offset = Number(url.searchParams.get("offset")) || 0
  const agent = url.searchParams.get("agent")
  const level = url.searchParams.get("level")

  const where: Prisma.AgentLogWhereInput = {}
  if (agent) where.agent = agent
  if (level) where.level = level

  const [logs, total] = await Promise.all([
    prisma.agentLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.agentLog.count({ where }),
  ])

  return NextResponse.json({ logs, total })
}
