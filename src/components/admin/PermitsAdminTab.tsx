"use client"

import { useEffect, useState } from "react"
import { Loader2, Shield, MapPin, FileCheck, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type PermitReq = { id: string; name: string; description: string | null; category: string; required: string; appliesTo: Record<string, unknown>; authority: string | null; source: string | null; notes: string | null; sortOrder: number }
type Auth = { id: string; name: string; type: string; region: string; district: string | null; website: string | null; phone: string | null; email: string | null; isActive: boolean }

const statusColors: Record<string, string> = {
  required: "bg-emerald-100 text-emerald-700",
  likely: "bg-amber-100 text-amber-700",
  conditional: "bg-orange-100 text-orange-700",
  verify: "bg-blue-100 text-blue-700",
}

export function PermitsAdminTab() {
  const [loading, setLoading] = useState(true)
  const [requirements, setRequirements] = useState<PermitReq[]>([])
  const [authorities, setAuthorities] = useState<Auth[]>([])
  const [activeSection, setActiveSection] = useState<"requirements" | "authorities">("requirements")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/admin/permits")
      .then(r => r.json())
      .then(d => { setRequirements(d.requirements); setAuthorities(d.authorities) })
      .catch(() => toast.error("Failed to load permit data"))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (id: string) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const requirementsByType = (bt: string) => requirements.filter(r => {
    const cats = r.appliesTo?.buildingCategories
    return !Array.isArray(cats) || (cats as string[]).includes(bt)
  })
  const authoritiesByType = (t: string) => authorities.filter(a => a.type === t)

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>

  return (
    <div className="space-y-6">
      {/* Section nav */}
      <div className="flex items-center gap-2">
        <button onClick={() => setActiveSection("requirements")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeSection === "requirements" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          <FileCheck className="h-4 w-4 inline mr-1.5" /> Permit Requirements ({requirements.length})
        </button>
        <button onClick={() => setActiveSection("authorities")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeSection === "authorities" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
          <MapPin className="h-4 w-4 inline mr-1.5" /> Authorities ({authorities.length})
        </button>
      </div>

      {activeSection === "requirements" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><FileCheck className="h-5 w-5 text-emerald-600" /> Permit Requirements</h3>

          {/* Group by category */}
          {["universal", "structural", "utility", "environmental", "industry", "professional", "financial"].map(cat => {
            const items = requirements.filter(r => r.category === cat)
            if (!items.length) return null
            return (
              <div key={cat} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <button onClick={() => toggle(`cat-${cat}`)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
                  <div className="text-left">
                    <span className="font-semibold text-slate-900 capitalize">{cat}</span>
                    <span className="text-xs text-slate-500 ml-2">{items.length} items</span>
                  </div>
                  {expanded[`cat-${cat}`] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                {expanded[`cat-${cat}`] && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                    <div className="grid gap-2">
                      {items.map(r => (
                        <div key={r.id} className="p-3 rounded-lg bg-white border border-slate-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-800">{r.name}</span>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColors[r.required] ?? "bg-slate-100 text-slate-700"}`}>
                                  {r.required}
                                </span>
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{r.appliesTo?.buildingCategories ? (r.appliesTo.buildingCategories as string[]).join(", ") : "all"}</span>
                              </div>
                              {r.description && <p className="text-xs text-slate-500 mt-1">{r.description}</p>}
                              {r.authority && <p className="text-[11px] text-slate-400 mt-1">Authority: {r.authority}</p>}
                              {r.appliesTo?.minFloors || r.appliesTo?.maxFloors || r.appliesTo?.minArea || r.appliesTo?.maxArea ? (
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {r.appliesTo.minArea ? `Min area: ${String(r.appliesTo.minArea)} m²` : ""}
                                  {r.appliesTo.minFloors ? ` · Floors ≥ ${String(r.appliesTo.minFloors)}` : ""}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {activeSection === "authorities" && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-600" /> Permit Authorities</h3>

          {/* MMDAs */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button onClick={() => toggle("mmdas")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
              <div className="text-left">
                <span className="font-semibold text-slate-900">Metropolitan / Municipal / District Assemblies</span>
                <span className="text-xs text-slate-500 ml-2">{authoritiesByType("MMDA").length} authorities</span>
              </div>
              {expanded["mmdas"] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {expanded["mmdas"] && (
              <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <div className="grid gap-1.5">
                  {authoritiesByType("MMDA").map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100">
                      <span className="text-sm text-slate-800">{a.name}</span>
                      <span className="text-[10px] text-slate-500">{a.region}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sector */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button onClick={() => toggle("sector")} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
              <div className="text-left">
                <span className="font-semibold text-slate-900">Sector Regulators</span>
                <span className="text-xs text-slate-500 ml-2">{authoritiesByType("sector").length} authorities</span>
              </div>
              {expanded["sector"] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {expanded["sector"] && (
              <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <div className="grid gap-1.5">
                  {authoritiesByType("sector").map(a => (
                    <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100">
                      <span className="text-sm text-slate-800">{a.name}</span>
                      <Shield className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
