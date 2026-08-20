"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { ArrowLeftRight, TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from "lucide-react"
import { useCsrfFetch } from "@/hooks/useCsrfFetch"

type EstimateSummary = {
  id: string; projectName: string; buildingType: string; location: string
  floorArea: number; floors: number; qualityLevel: string; version: number
  totalCost: number; baseCost: number; costPerSqm: number
  costRange: { low: number; mid: number; high: number } | null
  confidenceScore: number | null; professionalFees: number | null
  contingency: number | null; inputs: unknown; createdAt: string
  delta: { totalCost: number; totalCostPct: string; costPerSqm: number; floorArea: number } | null
}

export function ScenarioCompare({ estimateIds }: { estimateIds: string[] }) {
  const [loading, setLoading] = useState(true)
  const [estimates, setEstimates] = useState<EstimateSummary[]>([])
  const [error, setError] = useState<string | null>(null)
  const csrfFetch = useCsrfFetch()

  useEffect(() => {
    if (estimateIds.length < 2) return

    csrfFetch("/api/estimates/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: estimateIds }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setEstimates(d.estimates)
      })
      .catch(() => setError("Failed to load comparison"))
      .finally(() => setLoading(false))
  }, [estimateIds])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>
  if (error) return <div className="text-center py-8 text-sm text-red-500">{error}</div>
  if (estimates.length < 2) return null

  const baseline = estimates[0]
  const cheapest = [...estimates].sort((a, b) => a.totalCost - b.totalCost)[0]
  const mostExpensive = [...estimates].sort((a, b) => b.totalCost - a.totalCost)[0]

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-slate-900 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-emerald-600" /> Scenario Comparison
      </h3>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
          <div className="text-[10px] text-emerald-600 font-medium uppercase">Lowest</div>
          <div className="text-lg font-bold text-emerald-700">{formatCurrency(cheapest.totalCost)}</div>
          <div className="text-[11px] text-emerald-600">{cheapest.projectName}</div>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-[10px] text-slate-500 font-medium uppercase">Baseline</div>
          <div className="text-lg font-bold text-slate-900">{formatCurrency(baseline.totalCost)}</div>
          <div className="text-[11px] text-slate-500">{baseline.projectName}</div>
        </div>
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
          <div className="text-[10px] text-rose-600 font-medium uppercase">Highest</div>
          <div className="text-lg font-bold text-rose-700">{formatCurrency(mostExpensive.totalCost)}</div>
          <div className="text-[11px] text-rose-600">{mostExpensive.projectName}</div>
        </div>
      </div>

      {/* Side-by-side cards */}
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${estimates.length}, 1fr)` }}>
        {estimates.map((e, i) => (
          <div key={e.id} className={`rounded-xl border p-4 ${i === 0 ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold text-slate-900 text-sm">{e.projectName}</div>
                <div className="text-[10px] text-slate-500">v{e.version}</div>
              </div>
              {e.delta && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  e.delta.totalCost > 0 ? "bg-rose-100 text-rose-700" : e.delta.totalCost < 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {e.delta.totalCost > 0 ? <TrendingUp className="h-3 w-3" /> : e.delta.totalCost < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {e.delta.totalCostPct}%
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs text-slate-500">Total Cost</div>
                <div className="text-lg font-bold text-slate-900">{formatCurrency(e.totalCost)}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-400">Per m²</div>
                  <div className="font-medium text-slate-700">{formatCurrency(e.costPerSqm)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Area</div>
                  <div className="font-medium text-slate-700">{e.floorArea} m²</div>
                </div>
                <div>
                  <div className="text-slate-400">Location</div>
                  <div className="font-medium text-slate-700">{e.location}</div>
                </div>
                <div>
                  <div className="text-slate-400">Quality</div>
                  <div className="font-medium text-slate-700 capitalize">{e.qualityLevel}</div>
                </div>
              </div>
              {e.costRange && (
                <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-500 font-medium mb-1">Cost Range</div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-emerald-600 font-medium">{formatCurrency(e.costRange.low)}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-slate-700 font-bold">{formatCurrency(e.costRange.mid)}</span>
                    <span className="text-slate-300">→</span>
                    <span className="text-rose-600 font-medium">{formatCurrency(e.costRange.high)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
