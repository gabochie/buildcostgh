"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useCalculatorStore } from "@/store/calculatorStore"
import { Building2, Home, Hotel, Factory, Warehouse, GraduationCap, Heart, Landmark, ArrowRight, ChevronLeft } from "lucide-react"
import type { BuildingTypeSelection } from "@/store/calculatorStore"

interface BuildingCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  subtypes: {
    id: string
    name: string
    slug: string
    complexity: string
    typicalMinFloors: number
    typicalMaxFloors: number
  }[]
  costProfiles: {
    qualityLevel: string
    baseCostPerSqm: number
  }[]
}

const iconMap: Record<string, React.ReactNode> = {
  home: <Home className="h-7 w-7" />,
  "building-2": <Building2 className="h-7 w-7" />,
  hotel: <Hotel className="h-7 w-7" />,
  factory: <Factory className="h-7 w-7" />,
  warehouse: <Warehouse className="h-7 w-7" />,
  "graduation-cap": <GraduationCap className="h-7 w-7" />,
  heart: <Heart className="h-7 w-7" />,
  landmark: <Landmark className="h-7 w-7" />,
}

export function Step0BuildingType() {
  const { buildingType, setBuildingType, setStep } = useCalculatorStore()
  const [categories, setCategories] = useState<BuildingCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<BuildingCategory | null>(null)
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/building-types")
        if (res.ok) {
          const data = await res.json()
          setCategories(data.categories || [])
        }
      } catch { /* fallback to static */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (buildingType) {
      const cat = categories.find(c => c.slug === buildingType.categorySlug)
      if (cat) {
        setSelectedCategory(cat)
        setSelectedSubtype(buildingType.subtypeSlug)
      }
    }
  }, [buildingType, categories])

  const handleCategorySelect = (cat: BuildingCategory) => {
    setSelectedCategory(cat)
    setSelectedSubtype(null)
  }

  const handleContinue = () => {
    if (!selectedCategory) return
    const subtype = selectedCategory.subtypes.find(s => s.slug === selectedSubtype)
    setBuildingType({
      categorySlug: selectedCategory.slug,
      categoryName: selectedCategory.name,
      subtypeSlug: subtype?.slug || null,
      subtypeName: subtype?.name || null,
    })
    setStep(1)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Building Type</h2>
          <p className="text-sm text-gray-500">Step 1 of 7</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Building Type</h2>
        <p className="text-sm text-gray-500">Step 1 of 7 — What are you building?</p>
      </div>

      {!selectedCategory ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className="group relative text-left p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-emerald-400 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-100 transition-colors">
                {iconMap[cat.icon] || <Building2 className="h-7 w-7" />}
              </div>
              <div className="font-semibold text-gray-900 text-sm">{cat.name}</div>
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{cat.description}</div>
              <div className="text-[11px] text-gray-400 mt-2">
                {cat.subtypes.length} subtypes
                {cat.costProfiles.length > 0 && (
                  <> · from GHS {Math.round(cat.costProfiles[0].baseCostPerSqm).toLocaleString()}/m²</>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              {iconMap[selectedCategory.icon] || <Building2 className="h-6 w-6" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-900">{selectedCategory.name}</div>
              <div className="text-xs text-gray-500">{selectedCategory.description}</div>
            </div>
            <button
              type="button"
              onClick={() => { setSelectedCategory(null); setSelectedSubtype(null) }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Change
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Specific Type <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedCategory.subtypes.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubtype(sub.slug === selectedSubtype ? null : sub.slug)}
                  className={`text-left p-3 rounded-lg border text-sm transition-all ${
                    selectedSubtype === sub.slug
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="font-medium">{sub.name}</div>
                  <div className={`text-xs mt-0.5 ${selectedSubtype === sub.slug ? "text-emerald-100" : "text-gray-400"}`}>
                    {sub.typicalMinFloors}–{sub.typicalMaxFloors} floors · {sub.complexity}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              onClick={handleContinue}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!selectedCategory && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => { setBuildingType(null); setStep(1) }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Skip — use residential calculator
          </button>
        </div>
      )}
    </div>
  )
}
