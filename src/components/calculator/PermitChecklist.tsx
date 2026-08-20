"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileCheck, ChevronDown, ChevronUp, Shield, MapPin, AlertTriangle } from "lucide-react"

interface PermitItem {
  name: string
  description: string | null
  status: "required" | "likely" | "conditional" | "verify"
  authority: string | null
  source: string | null
  notes: string | null
}

interface PermitChecklistProps {
  location: string
  region: string | null
  buildingCategory: string
  authority: { name: string; type: string } | null
  requirements: PermitItem[]
  disclaimer: string
}

const STATUS_CONFIG = {
  required: { label: "Required", icon: "✓", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  likely: { label: "Likely Required", icon: "✓", color: "text-amber-600 bg-amber-50 border-amber-200" },
  conditional: { label: "Conditional", icon: "⚠", color: "text-orange-600 bg-orange-50 border-orange-200" },
  verify: { label: "Verify with Authority", icon: "?", color: "text-blue-600 bg-blue-50 border-blue-200" },
}

export function PermitChecklist({ location, region, buildingCategory, authority, requirements, disclaimer }: PermitChecklistProps) {
  const [expanded, setExpanded] = useState(true)

  if (!requirements.length) {
    return (
      <div className="rounded-xl border border-gray-200 p-4 text-center text-sm text-gray-500">
        No specific permit requirements found for this building type. Verify with your local authority.
      </div>
    )
  }

  const requiredCount = requirements.filter(r => r.status === "required").length
  const conditionalCount = requirements.filter(r => r.status === "conditional").length

  return (
    <div className="space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-emerald-600" />
          Building Permit & Approval Intelligence
        </h3>
        {expanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {/* ── Location + Authority ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <MapPin className="h-3 w-3" /> Location
              </div>
              <div className="text-sm font-medium text-gray-900">{location}</div>
              {region && <div className="text-xs text-gray-500">{region} Region</div>}
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                <Shield className="h-3 w-3" /> Likely Permit Authority
              </div>
              <div className="text-sm font-medium text-gray-900">
                {authority?.name ?? "Verify with local MMDA"}
              </div>
              {authority?.type && <div className="text-xs text-gray-500">{authority.type}</div>}
            </div>
          </div>

          {/* ── Summary ── */}
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
              {requiredCount} Required
            </span>
            <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
              {conditionalCount} Conditional
            </span>
            <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
              {requirements.length} Total Items
            </span>
          </div>

          {/* ── Requirements List ── */}
          <div className="space-y-2">
            {requirements.map((req) => {
              const cfg = STATUS_CONFIG[req.status]
              return (
                <div
                  key={req.name}
                  className={`rounded-lg border p-3 ${cfg.color}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{req.name}</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/60">
                          {cfg.label}
                        </span>
                      </div>
                      {req.description && (
                        <p className="text-xs mt-1 opacity-80">{req.description}</p>
                      )}
                      {req.authority && (
                        <p className="text-[11px] mt-1 opacity-60">Authority: {req.authority}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Disclaimer ── */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>{disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  )
}
