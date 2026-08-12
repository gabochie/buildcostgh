"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useCalculatorStore } from "@/store/calculatorStore"
import { formatCurrency } from "@/lib/utils"
import { Loader2, ArrowRight, TrendingUp, MapPin, Download, Shield } from "lucide-react"
import Link from "next/link"
import type { EstimateResult } from "@/types"
import { SignupGate } from "@/components/calculator/SignupGate"

const regionMultipliers: Record<string, number> = {
  Accra: 1.0,
  Kumasi: 0.85,
  Tema: 0.9,
  Takoradi: 0.8,
  Tamale: 0.7,
  "Cape Coast": 0.75,
  Sunyani: 0.72,
  Ho: 0.68,
  Koforidua: 0.7,
  Bolgatanga: 0.65,
  Wa: 0.67,
  Goaso: 0.7,
  Techiman: 0.73,
  Dambai: 0.69,
  "Sefwi Wiawso": 0.76,
  Nalerigu: 0.63,
  Damongo: 0.66,
}

function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    let startTimestamp: number | null = null
    const duration = 1500

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  }, [value])

  return <span>{formatCurrency(display)}</span>
}

export function Step5Result() {
  const { step1, step2, step3, step4, setStep, reset, setResult: persistResult, email } = useCalculatorStore()
  const { status } = useSession()
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState(step1.location)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res = await fetch("/api/calculator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...step1, ...step2, ...step3, ...step4 }),
        })
        const data = await res.json()
        if (res.ok) {
          setResult(data)
          persistResult(data)
        } else setError(data.error)
      } catch {
        setError("Failed to calculate estimate. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchEstimate()
  }, [step1, step2, step3, step4])

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || "Something went wrong"}</p>
        <Button variant="outline" onClick={() => setStep(1)}>
          Start Over
        </Button>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <SignupGate defaultEmail={email} />
  }

  const comparisonMultiplier = regionMultipliers[selectedRegion] || 1.0
  const baseMultiplier = regionMultipliers[step1.location] || 1.0
  const adjustedTotal = Math.round(result.breakdown.total * (comparisonMultiplier / baseMultiplier))

  const breakdownItems = [
    { label: "Foundation", value: Math.round(result.breakdown.baseCost * 0.18), pct: 18 },
    { label: "Structure", value: Math.round(result.breakdown.baseCost * 0.34), pct: 34 },
    { label: "Finishing", value: Math.round(result.breakdown.baseCost * 0.38), pct: 38 },
    { label: "Services & Add-ons", value: Math.round(result.breakdown.baseCost * 0.1) + result.breakdown.addonsCost, pct: 10 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Your Cost Estimate</h2>
        <p className="text-sm text-gray-500">Step 6 of 6</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 border border-emerald-200">
        <div className="text-sm text-gray-500 mb-1 font-medium">Estimated Total Cost</div>
        <div className="text-4xl md:text-5xl font-bold text-gradient-emerald mb-2">
          <AnimatedPrice value={result.breakdown.total} />
        </div>
        <div className="text-sm text-gray-600">
          {step1.bedrooms} Bedroom &middot; {step1.location} &middot; {step2.floorArea} m&sup2; &middot; Grade{" "}
          {step3.grade}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-500">Price per m&sup2;</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(result.summary.pricePerSqm)}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-500">Total Area</div>
          <div className="text-lg font-bold text-gray-900">{result.summary.totalSqm} m&sup2;</div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" /> Cost Breakdown
        </h3>
        {breakdownItems.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
        <div className="flex justify-between text-sm pt-2 border-t border-gray-200 font-bold">
          <span>Total</span>
          <span className="text-emerald-600">{formatCurrency(result.breakdown.total)}</span>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 text-emerald-600 font-medium text-sm hover:text-emerald-700"
        >
          <MapPin className="h-4 w-4" /> Compare costs in different regions
        </button>
        {showComparison && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <label className="text-sm font-medium text-gray-700">Select region to compare:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Object.keys(regionMultipliers).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="flex justify-between items-center p-3 rounded-lg bg-white border border-gray-100">
              <span className="text-sm text-gray-600">{step1.location} (your location)</span>
              <span className="font-bold text-gray-900">{formatCurrency(result.breakdown.total)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-sm text-emerald-800">{selectedRegion}</span>
              <span className="font-bold text-emerald-700">{formatCurrency(adjustedTotal)}</span>
            </div>
            <p className="text-xs text-gray-400">
              {adjustedTotal < result.breakdown.total
                ? `You could save ${formatCurrency(result.breakdown.total - adjustedTotal)} building in ${selectedRegion}!`
                : adjustedTotal > result.breakdown.total
                  ? `Building in ${selectedRegion} would cost ${formatCurrency(adjustedTotal - result.breakdown.total)} more.`
                  : "Same as your selected location."}
            </p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Note:</strong> This is a preliminary estimate. Actual costs may vary based on site conditions, material
        prices, and contractor rates. Get a detailed report for accurate planning.
      </div>

      <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200 text-center">
        <p className="text-lg font-bold text-emerald-800 mb-1">Get the Full Detailed Report</p>
        <p className="text-sm text-emerald-600 mb-4">Itemised breakdown, material quantities, contractor contacts & more</p>
        <Link href="/pricing">
          <Button className="bg-gradient-gold text-charcoal hover:opacity-90 font-bold border-0 px-8">
            <Download className="mr-2 h-4 w-4" /> Get Full Report from GHS 99
          </Button>
        </Link>
        <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-emerald-600">
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> 7-Day Guarantee</span>
          <span className="flex items-center gap-1"><Download className="h-3 w-3" /> Instant PDF</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="outline" onClick={reset} className="flex-1">
          Start New Calculation
        </Button>
      </div>
    </div>
  )
}
