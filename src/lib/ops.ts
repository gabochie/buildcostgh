import "server-only"
import type { Prisma } from "@prisma/client"
import { prisma } from "./prisma"
import { logAgentAction } from "./agent-log"
import { getQueueStats, processJobQueue } from "./queue"
import { loadContentPlan } from "./content-plan"
import { runPlanBatch } from "./content-planner"
import { llmConfigured, runSubagent } from "./cofounder/agent"
import { getSubagent } from "./cofounder/subagents"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
const STUCK_JOB_MS = Number(process.env.OPS_STUCK_JOB_MS ?? 30 * 60 * 1000) || 30 * 60 * 1000
const PROBE_TIMEOUT_MS = Number(process.env.OPS_PROBE_TIMEOUT_MS ?? 8000) || 8000
const PROBE_PATHS = ["/", "/blog", "/calculator", "/pricing", "/api/health"]

export function opsFlagEnabled(name: string, def = true): boolean {
  const v = process.env[name]
  if (v === undefined) return def
  return v !== "false" && v !== "0"
}

function isTransientError(msg: string): boolean {
  const m = msg?.toLowerCase() ?? ""
  return (
    /timeout|timed out|econnreset|socket hang up|fetch failed|etimedout|eai_again|eai_noname|network unreachable|5\d\d|rate ?limit|connection refused|connection reset|neon.*sleep|connection.*closed/.test(
      m
    )
  )
}

export type OpsCheck = { name: string; ok: boolean; detail?: string }

export type OpsReport = {
  ok: boolean
  summary: string | null
  checks: OpsCheck[]
  metrics: {
    dbLatencyMs: number | null
    orders24h: number
    revenue24hUsd: number
    totalOrders: number
    totalRevenueUsd: number
    leads24h: number
    subscribers24h: number
    contentDrafts: number
    blogDrafts: number
    socialQueued: number
    socialFailed: number
    overdueSocial: number
    queue: { pending: number; processing: number; completed: number; failed: number }
    errors24h: number
    warnings24h: number
  }
  repairs: string[]
  generatedAt: string
}

function emptyMetrics(): OpsReport["metrics"] {
  return {
    dbLatencyMs: null,
    orders24h: 0,
    revenue24hUsd: 0,
    totalOrders: 0,
    totalRevenueUsd: 0,
    leads24h: 0,
    subscribers24h: 0,
    contentDrafts: 0,
    blogDrafts: 0,
    socialQueued: 0,
    socialFailed: 0,
    overdueSocial: 0,
    queue: { pending: 0, processing: 0, completed: 0, failed: 0 },
    errors24h: 0,
    warnings24h: 0,
  }
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function renderReportText(report: OpsReport): string {
  const m = report.metrics
  const lines = [
    `checks: ${report.checks.map((c) => `${c.name}=${c.ok ? "ok" : "FAIL"}`).join(", ") || "none"}`,
    `repairs: ${report.repairs.join("; ") || "none"}`,
    `orders24h=${m.orders24h} revenue24h=${m.revenue24hUsd} totalOrders=${m.totalOrders} leads24h=${m.leads24h} subs24h=${m.subscribers24h}`,
    `queue pending=${m.queue.pending} processing=${m.queue.processing} failed=${m.queue.failed}`,
    `drafts=${m.contentDrafts} blogDrafts=${m.blogDrafts} socialQueued=${m.socialQueued} socialFailed=${m.socialFailed} overdueSocial=${m.overdueSocial}`,
    `logErrors24h=${m.errors24h} logWarnings24h=${m.warnings24h} dbLatencyMs=${m.dbLatencyMs ?? "n/a"}`,
  ]
  return lines.join("\n")
}

export async function runWatchtower(): Promise<OpsReport> {
  const repairs: string[] = []
  const checks: OpsCheck[] = []
  const metrics = emptyMetrics()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const dbOkFailure = { name: "database", ok: false, detail: "SELECT 1 failed" }

  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    metrics.dbLatencyMs = Date.now() - start
    checks.push({ name: "database", ok: true, detail: `${metrics.dbLatencyMs}ms` })
  } catch (err) {
    checks.push(dbOkFailure)
    console.error("ops.watchtower db check failed:", err)
  }

  const probes = await Promise.all(
    PROBE_PATHS.map(async (p) => {
      try {
        const res = await fetch(APP_URL + p, {
          method: "GET",
          redirect: "follow",
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
          headers: { "user-agent": "buildcostgh-ops-watchtower/1.0" },
        })
        return { p, ok: res.ok, detail: `HTTP ${res.status}` }
      } catch (err) {
        return { p, ok: false, detail: errMessage(err) }
      }
    })
  )
  for (const probe of probes) {
    checks.push({ name: `page:${probe.p}`, ok: probe.ok, detail: probe.detail })
  }

  const dbOk = checks.find((c) => c.name === "database")?.ok ?? false

  if (dbOk) {
    try {
      const [orders24, allOrders, leads24, subs24, drafts, blogDrafts, socialPending, socialFailed, overdue, logLevels, queue] =
        await Promise.all([
          prisma.order.findMany({ where: { createdAt: { gte: since } }, select: { amount: true } }),
          prisma.order.count(),
          prisma.calculatorLead.count({ where: { createdAt: { gte: since } } }),
          prisma.newsletterSubscriber.count({ where: { createdAt: { gte: since } } }),
          prisma.contentDraft.count(),
          prisma.blogPost.count({ where: { published: false } }),
          prisma.socialPost.count({ where: { status: "pending" } }),
          prisma.socialPost.count({ where: { status: "failed" } }),
          prisma.socialPost.count({ where: { status: "pending", scheduledAt: { lte: new Date() } } }),
          prisma.agentLog.findMany({ where: { createdAt: { gte: since } }, select: { level: true } }),
          getQueueStats(),
        ])

      metrics.orders24h = orders24.length
      metrics.revenue24hUsd = orders24.reduce((s, o) => s + Number(o.amount ?? 0), 0)
      metrics.totalOrders = allOrders
      metrics.leads24h = leads24
      metrics.subscribers24h = subs24
      metrics.contentDrafts = drafts
      metrics.blogDrafts = blogDrafts
      metrics.socialQueued = socialPending
      metrics.socialFailed = socialFailed
      metrics.overdueSocial = overdue
      metrics.queue = queue
      metrics.errors24h = logLevels.filter((l) => l.level === "error").length
      metrics.warnings24h = logLevels.filter((l) => l.level === "warning").length
    } catch (err) {
      checks.push({ name: "telemetry", ok: false, detail: errMessage(err) })
      console.error("ops.watchtower telemetry failed:", err)
    }
  }

  if (dbOk) {
    try {
      if (opsFlagEnabled("OPS_AUTO_RETRY_STUCK")) {
        const stuck = await prisma.job.updateMany({
          where: { status: "processing", startedAt: { lt: new Date(Date.now() - STUCK_JOB_MS) } },
          data: { status: "pending", startedAt: null, lastError: "stuck_reset_by_ops" },
        })
        if (stuck.count > 0) repairs.push(`requeued ${stuck.count} stuck job${stuck.count === 1 ? "" : "s"}`)
      }

      if (opsFlagEnabled("OPS_AUTO_DRAIN")) {
        const processed = await processJobQueue(Number(process.env.OPS_DRAIN_MAX ?? 25) || 25)
        if (processed > 0) repairs.push(`processed ${processed} queued job${processed === 1 ? "" : "s"}`)
      }

      if (opsFlagEnabled("OPS_AUTO_RETRY_TRANSIENT")) {
        const failed = await prisma.job.findMany({
          where: { status: "failed" },
          select: { id: true, lastError: true },
          take: 10,
        })
        const transient = failed.filter((f) => isTransientError(f.lastError ?? ""))
        if (transient.length > 0) {
          await prisma.job.updateMany({
            where: { id: { in: transient.map((t) => t.id) } },
            data: { status: "pending", attempts: 0, lastError: null, scheduledAt: new Date() },
          })
          repairs.push(`requeued ${transient.length} transiently failed job${transient.length === 1 ? "" : "s"}`)
          const processed = await processJobQueue(Number(process.env.OPS_DRAIN_MAX ?? 25) || 25)
          if (processed > 0) repairs.push(`processed ${processed} requeued job${processed === 1 ? "" : "s"}`)
        }
      }

      if (opsFlagEnabled("OPS_AUTO_CONTENT") && process.env.CONTENT_CRON_ENABLED !== "false") {
        const plan = loadContentPlan()
        if (plan) {
          const recent = await prisma.contentDraft.findFirst({
            where: { createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
            orderBy: { createdAt: "desc" },
            select: { id: true },
          })
          if (!recent) {
            const batch = await runPlanBatch(plan)
            if (batch.generated > 0) {
              repairs.push(`content agent backfilled ${batch.generated} plan slot${batch.generated === 1 ? "" : "s"}`)
            } else if (batch.error) {
              checks.push({ name: "content-backfill", ok: false, detail: batch.error })
            }
          }
        }
      }
    } catch (err) {
      checks.push({ name: "repairs", ok: false, detail: errMessage(err) })
      console.error("ops.watchtower repairs failed:", err)
    }
  }

  const report: OpsReport = {
    ok: checks.every((c) => c.ok),
    summary: null,
    checks,
    metrics,
    repairs,
    generatedAt: new Date().toISOString(),
  }

  if (opsFlagEnabled("OPS_SUMMARY")) {
    const opsAgent = getSubagent("ops")
    if (opsAgent && llmConfigured()) {
      try {
        report.summary = await runSubagent(
          opsAgent,
          `You are reviewing the latest automated watchtower run for buildcostgh.com.\n\n${renderReportText(report)}\n\nReply with a 1-2 paragraph operations brief: headline verdict, what was auto-repaired or is at risk, and up to 3 concrete actions ONLY the founder should take. Stay factual; do not invent numbers.`
        )
      } catch (err) {
        console.error("ops.watchtower summary failed:", err)
      }
    }
  }

  const failures = report.checks.filter((c) => !c.ok)
  const level =
    report.checks.some((c) => c.name === "database" && !c.ok) ? "error"
    : failures.length > 0 ? "warning"
    : "success"

  await logAgentAction({
    agent: "OpsWatchtower",
    action: "watchtower_run",
    entityType: "ops_check",
    level,
    details: report as unknown as Prisma.InputJsonObject,
  })

  return report
}