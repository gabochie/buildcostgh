import { prisma } from "./prisma"

type LogLevel = "info" | "success" | "warning" | "error"

export async function logAgentAction(params: {
  agent: string
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, any>
  level?: LogLevel
}) {
  try {
    await prisma.agentLog.create({
      data: {
        agent: params.agent,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details ?? {},
        level: params.level ?? "info",
      },
    })
  } catch (err) {
    console.error("Failed to log agent action:", err)
  }
}

export async function getAgentLogs(options?: {
  agent?: string
  level?: LogLevel
  limit?: number
  offset?: number
}) {
  const where: any = {}
  if (options?.agent) where.agent = options.agent
  if (options?.level) where.level = options.level

  const [logs, total] = await Promise.all([
    prisma.agentLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.agentLog.count({ where }),
  ])
  return { logs, total }
}
