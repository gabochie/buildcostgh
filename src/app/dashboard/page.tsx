"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import {
  Loader2, Bookmark, Trash2, Copy, BarChart3, Star, Clock, MapPin, Building2,
  ArrowLeft, Plus, FileText,
} from "lucide-react"
import { toast } from "sonner"
import { ScenarioCompare } from "@/components/calculator/ScenarioCompare"
import { useCsrfFetch } from "@/hooks/useCsrfFetch"

type SavedEstimate = {
  id: string; projectName: string; buildingType: string; location: string
  floorArea: number; floors: number; qualityLevel: string; version: number
  result: Record<string, unknown>; groupId: string | null; notes: string | null
  isFavorite: boolean; createdAt: string
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [estimates, setEstimates] = useState<SavedEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showCompare, setShowCompare] = useState(false)
  const csrfFetch = useCsrfFetch()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/dashboard")
      return
    }
    if (status !== "authenticated") return

    fetch("/api/estimates")
      .then(r => r.json())
      .then(d => setEstimates(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Failed to load estimates"))
      .finally(() => setLoading(false))
  }, [status, router])

  const deleteEstimate = async (id: string) => {
    if (!confirm("Delete this estimate?")) return
    await csrfFetch(`/api/estimates/${id}`, { method: "DELETE" })
    setEstimates(e => e.filter(x => x.id !== id))
    toast.success("Deleted")
  }

  const duplicateEstimate = async (id: string) => {
    const res = await csrfFetch(`/api/estimates/${id}/duplicate`, { method: "POST" })
    if (res.ok) {
      const dup = await res.json()
      setEstimates(e => [dup, ...e])
      toast.success("Duplicated")
    }
  }

  const toggleFavorite = async (id: string, current: boolean) => {
    const res = await csrfFetch(`/api/estimates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: !current }),
    })
    if (res.ok) {
      setEstimates(e => e.map(x => x.id === id ? { ...x, isFavorite: !current } : x))
    }
  }

  const toggleCompare = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 4) { toast.error("Max 4 scenarios to compare"); return prev }
      return [...prev, id]
    })
  }

  const getTotal = (e: SavedEstimate) => {
    const b = e.result?.breakdown as Record<string, unknown> | undefined
    return Number(b?.total ?? 0)
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const favorites = estimates.filter(e => e.isFavorite)
  const recent = estimates.filter(e => !e.isFavorite)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Estimates</h1>
            <p className="text-sm text-slate-500 mt-1">{estimates.length} saved estimate{estimates.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            {selectedIds.length >= 2 && (
              <Button onClick={() => setShowCompare(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <BarChart3 className="h-4 w-4 mr-2" /> Compare ({selectedIds.length})
              </Button>
            )}
            <Link href="/calculator">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> New Estimate
              </Button>
            </Link>
          </div>
        </div>

        {/* Compare panel */}
        {showCompare && selectedIds.length >= 2 && (
          <div className="mb-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Comparing {selectedIds.length} scenarios</h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowCompare(false); setSelectedIds([]) }}>Close</Button>
            </div>
            <ScenarioCompare estimateIds={selectedIds} />
          </div>
        )}

        {estimates.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">No saved estimates yet</h2>
            <p className="text-slate-500 mb-6">Run a calculation and save it to compare scenarios later</p>
            <Link href="/calculator">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> Create First Estimate
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Favorites */}
            {favorites.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" /> Favorites
                </h3>
                <div className="grid gap-3">
                  {favorites.map(e => (
                    <EstimateCard
                      key={e.id}
                      estimate={e}
                      total={getTotal(e)}
                      selected={selectedIds.includes(e.id)}
                      onToggleCompare={() => toggleCompare(e.id)}
                      onDelete={() => deleteEstimate(e.id)}
                      onDuplicate={() => duplicateEstimate(e.id)}
                      onToggleFavorite={() => toggleFavorite(e.id, true)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent */}
            {recent.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" /> Recent
                </h3>
                <div className="grid gap-3">
                  {recent.map(e => (
                    <EstimateCard
                      key={e.id}
                      estimate={e}
                      total={getTotal(e)}
                      selected={selectedIds.includes(e.id)}
                      onToggleCompare={() => toggleCompare(e.id)}
                      onDelete={() => deleteEstimate(e.id)}
                      onDuplicate={() => duplicateEstimate(e.id)}
                      onToggleFavorite={() => toggleFavorite(e.id, false)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EstimateCard({
  estimate: e, total, selected, onToggleCompare, onDelete, onDuplicate, onToggleFavorite,
}: {
  estimate: SavedEstimate; total: number; selected: boolean
  onToggleCompare: () => void; onDelete: () => void; onDuplicate: () => void; onToggleFavorite: () => void
}) {
  return (
    <div className={`rounded-xl border p-4 bg-white transition-all ${selected ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200 hover:border-slate-300"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-900 truncate">{e.projectName}</span>
            {e.version > 1 && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">v{e.version}</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{e.floorArea} m² · {e.floors} floor{e.floors > 1 ? "s" : ""}</span>
            <span className="capitalize">{e.qualityLevel}</span>
          </div>
          {e.notes && <p className="text-xs text-slate-400 mt-1 truncate">{e.notes}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-emerald-700">{formatCurrency(total)}</div>
          <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            {new Date(e.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        <Button
          variant={selected ? "default" : "outline"}
          size="sm"
          onClick={onToggleCompare}
          className={selected ? "bg-emerald-600 text-white hover:bg-emerald-700" : ""}
        >
          <BarChart3 className="h-3.5 w-3.5 mr-1" />
          {selected ? "Selected" : "Compare"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleFavorite}>
          <Star className={`h-3.5 w-3.5 ${e.isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-400"}`} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5 text-slate-400" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-400 hover:text-red-600">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
