"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useCalculatorStore } from "@/store/calculatorStore"
import { formatCurrency } from "@/lib/utils"
import { Loader2, TrendingUp, Download, Shield, ArrowLeftRight, BarChart3 } from "lucide-react"
import Link from "next/link"
import type { EstimateResult } from "@/types"
import { SignupGate } from "@/components/calculator/SignupGate"
import { LOCATION_MULTIPLIERS, CATEGORY_SPLITS } from "@/lib/pricing-constants"
import { ElementalBreakdown } from "@/components/calculator/ElementalBreakdown"
import { CostRangeDisplay } from "@/components/calculator/CostRange"
import { ProfessionalFees } from "@/components/calculator/ProfessionalFees"
import { AssumptionsPanel } from "@/components/calculator/AssumptionsPanel"
import { PermitChecklist } from "@/components/calculator/PermitChecklist"
import { SaveEstimateDialog } from "@/components/calculator/SaveEstimateDialog"
import { useCsrfFetch } from "@/hooks/useCsrfFetch"

function AnimatedPrice({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
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
  const { step1, step2, step3, step4, buildingType, setStep, reset, setResult: persistResult, email } = useCalculatorStore()
  const { status } = useSession()
  const [result, setResult] = useState<EstimateResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRegion, setSelectedRegion] = useState(step1.location)
  const [showComparison, setShowComparison] = useState(false)
  const [permitData, setPermitData] = useState<Record<string, unknown> | null>(null)
  const csrfFetch = useCsrfFetch()

  const hasExtended = !!result?.extended

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const res = await csrfFetch("/api/calculator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...step1, ...step2, ...step3, ...step4,
            buildingCategorySlug: buildingType?.categorySlug || "residential",
            buildingSubtypeSlug: buildingType?.subtypeSlug || undefined,
          }),
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
  }, [step1, step2, step3, step4, buildingType])

  // Fetch permit checklist when extended data is available
  useEffect(() => {
    if (!hasExtended || !result?.extended) return

    const fetchPermit = async () => {
      try {
        const res = await csrfFetch("/api/permit-checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buildingCategorySlug: buildingType?.categorySlug || "residential",
            location: step1.location,
            floorArea: Number(step2.floorArea) || 100,
            floors: step2.floors === "Two Floors" ? 2 : step2.floors === "Three Floors" ? 3 : 1,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          setPermitData(data)
        }
      } catch { /* Permit fetch is non-critical */ }
    }

    fetchPermit()
  }, [hasExtended, result, step1.location, step2.floorArea, step2.floors, buildingType])

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
        <Button variant="outline" onClick={() => setStep(0)}>
          Start Over
        </Button>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <SignupGate defaultEmail={email} />
  }

  const comparisonMultiplier = LOCATION_MULTIPLIERS[selectedRegion] || 1.0
  const baseMultiplier = LOCATION_MULTIPLIERS[step1.location] || 1.0
  const adjustedTotal = Math.round(result.breakdown.total * (comparisonMultiplier / baseMultiplier))

  const split = CATEGORY_SPLITS[step3.grade] || CATEGORY_SPLITS.B
  const baseCost = result.breakdown.baseCost

  const breakdownItems = result.categories
    ? [
        { label: "Foundation", value: result.categories.foundation, pct: Math.round((result.categories.foundation / result.breakdown.total) * 100) },
        { label: "Structure", value: result.categories.structure, pct: Math.round((result.categories.structure / result.breakdown.total) * 100) },
        { label: "Finishing", value: result.categories.finishing, pct: Math.round((result.categories.finishing / result.breakdown.total) * 100) },
        { label: "Services & Add-ons", value: result.categories.services, pct: Math.round((result.categories.services / result.breakdown.total) * 100) },
      ]
    : [
        { label: "Foundation", value: Math.round(baseCost * split.foundation), pct: Math.round(split.foundation * 100) },
        { label: "Structure", value: Math.round(baseCost * split.structure), pct: Math.round(split.structure * 100) },
        { label: "Finishing", value: Math.round(baseCost * split.finishing), pct: Math.round(split.finishing * 100) },
        { label: "Services & Add-ons", value: Math.round(baseCost * split.services) + result.breakdown.addonsCost, pct: Math.round(split.services * 100) },
      ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Your Cost Estimate</h2>
        <p className="text-sm text-gray-500">Step 8 of 8</p>
      </div>

      {/* ── Cost Range (extended) or Animated Total (legacy) ── */}
      {hasExtended && result.extended ? (
        <CostRangeDisplay
          low={result.extended.costRange.low}
          high={result.extended.costRange.high}
          midpoint={result.breakdown.total}
          confidence={result.extended.confidenceScore}
        />
      ) : (
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-6 border border-emerald-200">
          <div className="text-sm text-gray-500 mb-1 font-medium">Estimated Total Cost</div>
          <div className="text-4xl md:text-5xl font-bold text-gradient-emerald mb-2">
            <AnimatedPrice value={result.breakdown.total} />
          </div>
          <div className="text-sm text-gray-600">
            {buildingType ? (
              <>
                {buildingType.categoryName}
                {buildingType.subtypeName && <span> · {buildingType.subtypeName}</span>}
              </>
            ) : (
              <>{step1.bedrooms} Bedroom</>
            )}
            {" "}&middot; {step1.location} &middot; {step2.floorArea} m&sup2; &middot; Grade{" "}
            {step3.grade}
          </div>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className={`grid gap-4 ${hasExtended ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-500">Price per m&sup2;</div>
          <div className="text-lg font-bold text-gray-900">{formatCurrency(result.summary.pricePerSqm)}</div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200">
          <div className="text-sm text-gray-500">Total Area</div>
          <div className="text-lg font-bold text-gray-900">{result.summary.totalSqm} m&sup2;</div>
        </div>
        {hasExtended && result.extended && (
          <div className="p-4 rounded-xl border border-gray-200">
            <div className="text-sm text-gray-500">Professional Fees</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(result.extended.totalProfessionalFees)}</div>
          </div>
        )}
      </div>

      {/* ── Elemental Breakdown (extended) or Basic Breakdown (legacy) ── */}
      {hasExtended && result.extended ? (
        <ElementalBreakdown
          items={result.extended.elementalBreakdown}
          totalCost={result.breakdown.baseCost}
        />
      ) : (
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
      )}

      {/* ── Professional Fees (extended only) ── */}
      {hasExtended && result.extended && (
        <ProfessionalFees
          fees={result.extended.professionalFees}
          total={result.extended.totalProfessionalFees}
        />
      )}

      {/* ── Contingency + Escalation summary (extended only) ── */}
      {hasExtended && result.extended && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-200">
            <div className="text-sm text-gray-500">Contingency</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(result.extended.contingency)}</div>
            <div className="text-xs text-gray-400">10% of subtotal</div>
          </div>
          <div className="p-4 rounded-xl border border-gray-200">
            <div className="text-sm text-gray-500">Escalation Allowance</div>
            <div className="text-lg font-bold text-gray-900">{formatCurrency(result.extended.escalation)}</div>
            <div className="text-xs text-gray-400">5% market adjustment</div>
          </div>
        </div>
      )}

      {/* ── Assumptions (extended only) ── */}
      {hasExtended && result.extended && (
        <AssumptionsPanel
          assumptions={result.extended.assumptions}
          exclusions={result.extended.exclusions}
          dataSource={result.extended.dataSource}
        />
      )}

      {/* ── Permit Intelligence (extended only) ── */}
      {hasExtended && permitData && (
        <PermitChecklist
          location={(permitData as { location: string }).location}
          region={(permitData as { region: string | null }).region}
          buildingCategory={(permitData as { buildingCategory: string }).buildingCategory}
          authority={(permitData as { authority: { name: string; type: string } | null }).authority}
          requirements={(permitData as { requirements: Array<{ name: string; description: string | null; status: "required" | "likely" | "conditional" | "verify"; authority: string | null; source: string | null; notes: string | null }> }).requirements}
          disclaimer={(permitData as { disclaimer: string }).disclaimer}
        />
      )}

      {/* ── Region Comparison ── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 text-emerald-600 font-medium text-sm hover:text-emerald-700"
        >
          <ArrowLeftRight className="h-4 w-4" /> Compare costs in different regions
        </button>
        {showComparison && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <label className="text-sm font-medium text-gray-700">Select region to compare:</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {Object.keys(LOCATION_MULTIPLIERS).map((r) => (
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

      {/* ── Disclaimer ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>Note:</strong> This is an indicative estimate. Actual costs may vary based on site conditions, material
        prices, and contractor rates. Get a detailed report for accurate planning.
      </div>

      {/* ── CTA ── */}
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
        <SaveEstimateDialog
          result={result}
          inputs={{ ...step1, ...step2, ...step3, ...step4 }}
          buildingType={buildingType?.categorySlug || "residential"}
          location={step1.location}
          floorArea={Number(step2.floorArea) || 0}
          floors={step2.floors === "Two Floors" ? 2 : step2.floors === "Three Floors" ? 3 : 1}
          qualityLevel={step3.grade}
        />
        <Link href="/dashboard" className="flex-1">
          <Button variant="outline" className="w-full">
            <BarChart3 className="h-4 w-4 mr-2" /> My Estimates
          </Button>
        </Link>
        <Button variant="outline" onClick={reset} className="flex-1">
          Start New Calculation
        </Button>
      </div>
    </div>
  )
}
