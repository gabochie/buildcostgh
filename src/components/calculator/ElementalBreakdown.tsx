"use client"

import { formatCurrency } from "@/lib/utils"

export interface ElementalItem {
  name: string
  amount: number
  percentage: number
  costPerSqm: number
}

interface ElementalBreakdownProps {
  items: ElementalItem[]
  totalCost: number
}

const ELEMENT_COLORS: Record<string, string> = {
  Substructure: "bg-amber-500",
  Frame: "bg-orange-500",
  "Upper Floors": "bg-red-400",
  Roof: "bg-rose-400",
  "External Walls": "bg-pink-400",
  "Windows & Doors": "bg-purple-400",
  "Internal Finishes": "bg-indigo-400",
  "External Finishes": "bg-blue-400",
  Fittings: "bg-cyan-400",
  "Mechanical (MEP)": "bg-teal-500",
  "Electrical (MEP)": "bg-emerald-500",
  "Fire Protection": "bg-green-500",
}

export function ElementalBreakdown({ items, totalCost }: ElementalBreakdownProps) {
  if (!items.length) return null

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 text-sm">Elemental Cost Breakdown</h3>
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex justify-between items-baseline text-sm mb-1">
              <span className="text-gray-600">{item.name}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-400">{item.percentage.toFixed(1)}%</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${ELEMENT_COLORS[item.name] ?? "bg-gray-400"}`}
                style={{ width: `${Math.max(item.percentage, 2)}%` }}
              />
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">{formatCurrency(item.costPerSqm)}/m²</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm pt-2 border-t border-gray-200 font-bold">
        <span>Total Construction Cost</span>
        <span className="text-emerald-600">{formatCurrency(totalCost)}</span>
      </div>
    </div>
  )
}
