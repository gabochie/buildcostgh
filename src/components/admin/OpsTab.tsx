"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, ShieldCheck, AlertTriangle, XCircle, Activity, RefreshCw, CheckCircle, Wrench } from "lucide-react"

type OpsCheck = { name: string; ok: boolean; detail?: string }

type OpsReport = {
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

type OpsRun = {
  id: string
  level: string
  action: string
  createdAt: string
  details: OpsReport | null
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "-"
  return new Date(iso).toLocaleString()
}

function fmtMoney(v: number): string {
  return "$" + v.toLocaleString()
}

export function OpsTab() {
  const [runs, setRuns] = useState<OpsRun[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/ops/history")
      if (!res.ok) throw new Error("Failed to load ops history")
      const data = await res.json()
      setRuns((data.runs ?? []) as OpsRun[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load ops history")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const runNow = async () => {
    setRunning(true)
    try {
      const res = await fetch("/api/ops/watchtower", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Watchtower run failed")
      const report: OpsReport = data
      toast[report.ok ? "success" : "warning"](
        report.ok ? "System healthy" : `${report.checks.filter((c) => !c.ok).length} check(s) flagged`
      )
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Watchtower run failed")
    } finally {
      setRunning(false)
    }
  }

  const latest = runs[0]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Autonomous Ops Watchtower</h2>
          <p className="text-sm text-slate-500 mt-1">
            Runs on a schedule via GitHub Actions. Checks DB + public pages, drains the job queue,
            retries transient failures, backfills content, and logs every action.
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium shadow-lg shadow-emerald-200"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {running ? "Running checks..." : "Run check now"}
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          <Activity className="h-8 w-8 mx-auto mb-3 opacity-50" />
          No watchtower runs yet. Click &quot;Run check now&quot; to perform the first autonomous health check.
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => {
            const d = run.details
            const failed = d?.checks.filter((c) => !c.ok) ?? []
            return (
              <div key={run.id} className="rounded-xl bg-white border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {run.level === "success" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : run.level === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium text-slate-900">Run {fmtTime(run.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>
                      <ShieldCheck className="h-4 w-4 inline mr-1 text-slate-400" />
                      {d?.checks.length ?? 0} checks
                    </span>
                    <span className={failed.length > 0 ? "text-amber-600 font-medium" : "text-emerald-600 font-medium"}>
                      {failed.length > 0 ? `${failed.length} flagged` : "all pass"}
                    </span>
                  </div>
                </div>

                {d?.summary ? (
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 mb-4 whitespace-pre-wrap">{d.summary}</p>
                ) : null}

                {d && d.repairs.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Wrench className="h-3.5 w-3.5" /> Auto-repairs performed
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {d.repairs.map((r, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs">
                          <CheckCircle className="h-3.5 w-3.5" /> {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {d && d.checks.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {d.checks.map((c) => (
                      <div
                        key={c.name}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                          c.ok ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50"
                        }`}
                      >
                        <span className="text-slate-700 font-medium">{c.name}</span>
                        <span className={`text-xs ${c.ok ? "text-emerald-600" : "text-red-600"}`}>
                          {c.ok ? "OK" : c.detail || "FAIL"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {d ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <Metric label="Orders 24h" value={String(d.metrics.orders24h)} />
                    <Metric label="Revenue 24h" value={fmtMoney(d.metrics.revenue24hUsd)} />
                    <Metric label="Leads 24h" value={String(d.metrics.leads24h)} />
                    <Metric label="Subscribers 24h" value={String(d.metrics.subscribers24h)} />
                    <Metric label="Queue" value={`${d.metrics.queue.pending} pending`} />
                    <Metric label="Queue failures" value={String(d.metrics.queue.failed)} />
                    <Metric label="Drafts" value={String(d.metrics.contentDrafts)} />
                    <Metric label="DB latency" value={d.metrics.dbLatencyMs === null ? "-" : `${d.metrics.dbLatencyMs}ms`} />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  )
}