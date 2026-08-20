"use client"

import { useCalculatorStore, useHasHydrated } from "@/store/calculatorStore"
import { Mountain, Truck, Building, ArrowRight, ArrowLeft, SkipForward } from "lucide-react"

const terrainOptions = [
  { value: "flat", label: "Flat", desc: "Level ground, minimal excavation", icon: "🟩" },
  { value: "sloping", label: "Sloping", desc: "Moderate gradient, some retaining", icon: "⛰️" },
  { value: "steep", label: "Steep", desc: "Significant cuts/fills required", icon: "🏔️" },
]

const accessOptions = [
  { value: "easy", label: "Easy", desc: "Tarred road, large vehicle access", icon: "🛤️" },
  { value: "moderate", label: "Moderate", desc: "Partial road, some material hauling", icon: "🚜" },
  { value: "difficult", label: "Difficult", desc: "Remote, narrow paths, high transport cost", icon: "🚧" },
]

const settingOptions = [
  { value: "urban", label: "Urban", desc: "City centre, utilities available", icon: "🏙️" },
  { value: "peri_urban", label: "Peri-Urban", desc: "Outskirts, limited infrastructure", icon: "🏘️" },
  { value: "rural", label: "Rural", desc: "Countryside, basic utilities", icon: "🌾" },
]

export function Step2SiteConditions() {
  const hydrated = useHasHydrated()
  const { siteConditions, setSiteConditions, setStep } = useCalculatorStore()

  if (!hydrated) return null

  const canProceed = siteConditions.terrain && siteConditions.access && siteConditions.setting

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-heading font-semibold text-charcoal mb-1">
          Site Conditions
        </h2>
        <p className="text-sm text-gray-500">
          These affect excavation, transport, and foundation costs.
        </p>
      </div>

      {/* Terrain */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Mountain className="h-4 w-4 text-emerald-600" />
          <label className="text-sm font-medium text-gray-700">Terrain</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {terrainOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSiteConditions({ ...siteConditions, terrain: opt.value })}
              className={`p-3 rounded-xl border text-left transition-all ${
                siteConditions.terrain === opt.value
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-lg mb-1">{opt.icon}</div>
              <div className="text-sm font-medium text-gray-900">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Access */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Truck className="h-4 w-4 text-emerald-600" />
          <label className="text-sm font-medium text-gray-700">Site Access</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {accessOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSiteConditions({ ...siteConditions, access: opt.value })}
              className={`p-3 rounded-xl border text-left transition-all ${
                siteConditions.access === opt.value
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-lg mb-1">{opt.icon}</div>
              <div className="text-sm font-medium text-gray-900">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Setting */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Building className="h-4 w-4 text-emerald-600" />
          <label className="text-sm font-medium text-gray-700">Site Setting</label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {settingOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSiteConditions({ ...siteConditions, setting: opt.value })}
              className={`p-3 rounded-xl border text-left transition-all ${
                siteConditions.setting === opt.value
                  ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="text-lg mb-1">{opt.icon}</div>
              <div className="text-sm font-medium text-gray-900">{opt.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 px-5 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSiteConditions({ terrain: "flat", access: "easy", setting: "urban" })
              setStep(3)
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SkipForward className="h-3.5 w-3.5" /> Use defaults
          </button>
          <button
            onClick={() => canProceed && setStep(3)}
            disabled={!canProceed}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
