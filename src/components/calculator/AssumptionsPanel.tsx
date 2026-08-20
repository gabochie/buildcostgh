"use client"

import { useState } from "react"
import { Info, ChevronDown, ChevronUp } from "lucide-react"

interface AssumptionsModalProps {
  assumptions: string[]
  exclusions: string[]
  dataSource: string
}

export function AssumptionsPanel({ assumptions, exclusions, dataSource }: AssumptionsModalProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Info className="h-4 w-4 text-blue-500" />
          How was this calculated?
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 py-4 space-y-4 text-sm border-t border-gray-100">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Assumptions</h4>
            <ul className="space-y-1.5">
              {assumptions.map((a, i) => (
                <li key={i} className="flex gap-2 text-gray-600">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Exclusions</h4>
            <ul className="space-y-1.5">
              {exclusions.map((e, i) => (
                <li key={i} className="flex gap-2 text-gray-500">
                  <span className="text-red-400 mt-0.5">—</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Data source: <span className="font-medium text-gray-500">{dataSource}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This is an indicative estimate. Actual costs may vary based on market conditions, specifications, and site实际情况. Consult a qualified quantity surveyor for a professional estimate.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
