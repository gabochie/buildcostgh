"use client"

import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface CostRangeProps {
  low: number
  high: number
  midpoint: number
  confidence: "low" | "medium" | "high"
}

const CONFIDENCE_CONFIG = {
  high: { label: "High Confidence", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: TrendingUp },
  medium: { label: "Medium Confidence", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Minus },
  low: { label: "Low Confidence", color: "bg-red-100 text-red-700 border-red-200", icon: TrendingDown },
}

function formatCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000
    return `GH₵${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (amount >= 1_000) {
    const k = amount / 1_000
    return `GH₵${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`
  }
  return formatCurrency(amount)
}

export function CostRangeDisplay({ low, high, midpoint, confidence }: CostRangeProps) {
  const cfg = CONFIDENCE_CONFIG[confidence]
  const Icon = cfg.icon

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-5 border border-emerald-200">
        <div className="text-sm text-gray-500 mb-1 font-medium">Indicative Construction Cost</div>
        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
          {formatCompact(low)} &ndash; {formatCompact(high)}
        </div>
        <div className="text-sm text-gray-600">
          Midpoint estimate: <span className="font-semibold text-emerald-700">{formatCurrency(midpoint)}</span>
        </div>
      </div>

      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${cfg.color}`}>
        <Icon className="h-3 w-3" />
        {cfg.label}
      </div>

      <p className="text-xs text-gray-400">
        Range reflects data availability and building complexity. A professional quantity surveyor can provide a more precise estimate.
      </p>
    </div>
  )
}
