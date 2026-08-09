import { prisma } from "./prisma"
import type { Prisma } from "@prisma/client"

type JobHandler = (payload: Prisma.JsonValue) => Promise<void>

const handlers = new Map<string, JobHandler>()

export function registerJobHandler(type: string, handler: JobHandler) {
  handlers.set(type, handler)
}

export async function enqueueJob(type: string, payload?: Prisma.JsonValue, scheduledAt?: Date) {
  const job = await prisma.job.create({
    data: {
      type,
      payload: payload ?? {},
      scheduledAt: scheduledAt ?? new Date(),
    },
  })
  return job
}

export async function processNextJob(): Promise<boolean> {
  // Acquire next pending job using SKIP LOCKED
  const job = await prisma.$transaction(async (tx) => {
    const [next] = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "Job"
      WHERE status = 'pending'
        AND "scheduledAt" <= NOW()
      ORDER BY "scheduledAt" ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `
    if (!next) return null

    return tx.job.update({
      where: { id: next.id },
      data: { status: "processing", startedAt: new Date() },
    })
  })

  if (!job) return false

  const handler = handlers.get(job.type)
  if (!handler) {
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "failed", lastError: `No handler registered for type: ${job.type}` },
    })
    return true
  }

  try {
    await handler(job.payload)
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "completed", completedAt: new Date() },
    })
  } catch (err) {
    const attempts = job.attempts + 1
    const update: Prisma.JobUncheckedUpdateInput = {
      status: attempts >= job.maxAttempts ? "failed" : "pending",
      attempts,
      lastError: err instanceof Error ? err.message : String(err),
    }
    if (update.status === "pending") {
      update.scheduledAt = new Date(Date.now() + Math.pow(2, attempts) * 1000)
    }
    await prisma.job.update({ where: { id: job.id }, data: update })
  }

  return true
}

export async function processJobQueue(maxJobs = 10) {
  let processed = 0
  while (processed < maxJobs) {
    const hadWork = await processNextJob()
    if (!hadWork) break
    processed++
  }
  return processed
}

export async function getQueueStats() {
  const [pending, processing, completed, failed] = await Promise.all([
    prisma.job.count({ where: { status: "pending" } }),
    prisma.job.count({ where: { status: "processing" } }),
    prisma.job.count({ where: { status: "completed" } }),
    prisma.job.count({ where: { status: "failed" } }),
  ])
  return { pending, processing, completed, failed }
}

export async function retryFailedJobs() {
  const result = await prisma.job.updateMany({
    where: { status: "failed" },
    data: { status: "pending", attempts: 0, lastError: null, scheduledAt: new Date() },
  })
  return result.count
}
