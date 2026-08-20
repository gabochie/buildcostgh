"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Trash2, Building2, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Category = { id: string; name: string; slug: string; icon: string | null; sortOrder: number; description: string | null }
type Subtype = { id: string; name: string; slug: string; categoryId: string; category: { slug: string }; sortOrder: number; description: string | null; typicalMinFloors: number; typicalMaxFloors: number; complexity: string; isActive: boolean }
type Profile = { id: string; categoryId: string; category: { slug: string }; qualityLevel: string; baseCostPerSqm: number; source: string | null; confidenceLevel: string }

export function BuildingTypesAdminTab() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [subtypes, setSubtypes] = useState<Subtype[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/admin/building-types")
      .then(r => r.json())
      .then(d => { setCategories(d.categories); setSubtypes(d.subtypes); setProfiles(d.profiles) })
      .catch(() => toast.error("Failed to load building types"))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (slug: string) => setExpanded(p => ({ ...p, [slug]: !p[slug] }))

  const profilesByCategory = (catSlug: string) => profiles.filter(p => p.category.slug === catSlug)
  const subtypesByCategory = (catSlug: string) => subtypes.filter(s => s.category.slug === catSlug)

  const deleteCategory = async (id: string, slug: string) => {
    if (!confirm("Delete this category and all its subtypes + profiles?")) return
    try {
      await fetch(`/api/admin/building-types`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "category", id }) })
      setCategories(c => c.filter(x => x.id !== id))
      setSubtypes(s => s.filter(x => x.categoryId !== id))
      setProfiles(p => p.filter(x => x.categoryId !== id))
      toast.success("Category deleted")
    } catch { toast.error("Delete failed") }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Building2 className="h-5 w-5 text-emerald-600" /> Building Type Taxonomy</h2>
          <p className="text-sm text-slate-500 mt-1">{categories.length} categories · {subtypes.length} subtypes · {profiles.length} cost profiles</p>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map(cat => (
          <div key={cat.slug} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button onClick={() => toggle(cat.slug)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3">
                <span className="text-lg">{cat.icon ?? "🏗"}</span>
                <div className="text-left">
                  <div className="font-semibold text-slate-900">{cat.name}</div>
                  <div className="text-xs text-slate-500">{cat.slug} · {subtypesByCategory(cat.slug).length} subtypes · {profilesByCategory(cat.slug).length} profiles</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id, cat.slug) }} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
                {expanded[cat.slug] ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {expanded[cat.slug] && (
              <div className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/50">
                {/* Subtypes */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Subtypes</h4>
                  <div className="grid gap-2">
                    {subtypesByCategory(cat.slug).map(st => (
                      <div key={st.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100">
                        <div>
                          <span className="text-sm font-medium text-slate-800">{st.name}</span>
                          <span className="text-xs text-slate-400 ml-2">({st.slug})</span>
                          <span className="text-xs text-slate-500 ml-2">· {st.typicalMinFloors}–{st.typicalMaxFloors} storeys</span>
                          <span className="text-xs text-slate-400 ml-2">· {st.complexity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cost Profiles */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cost Profiles</h4>
                  <div className="grid gap-2">
                    {profilesByCategory(cat.slug).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 capitalize">{p.qualityLevel}</span>
                          <span className="text-sm text-slate-700">
                            GHS {Number(p.baseCostPerSqm).toLocaleString()} / m²
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">{p.source ?? p.confidenceLevel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
