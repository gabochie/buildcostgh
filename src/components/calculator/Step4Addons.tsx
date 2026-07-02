"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useCalculatorStore } from "@/store/calculatorStore"

const options = {
  pool: ["No Pool", "Small Pool (3x6m)", "Medium Pool (5x10m)", "Large Pool (8x15m)"],
  garden: ["No Garden", "Basic Garden", "Extensive Landscaping"],
  security: ["Basic Security", "Advanced Security", "Premium Security"],
  solar: ["No Solar", "Basic Solar System", "Full Solar System"],
}

export function Step4Addons() {
  const { step4, setStep4, setStep } = useCalculatorStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Additional Features</h2>
        <p className="text-sm text-gray-500">Step 5 of 6</p>
      </div>

      {Object.entries(options).map(([key, values]) => (
        <div key={key} className="space-y-2">
          <Label className="capitalize">
            {key === "pool" ? "Swimming Pool" : key === "solar" ? "Solar Installation" : key}
          </Label>
          <div className="flex gap-2 flex-wrap">
            {values.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setStep4({ ...step4, [key]: v })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                  step4[key as keyof typeof step4] === v
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(4)}>
          Previous
        </Button>
        <Button onClick={() => setStep(6)} className="bg-gradient-primary text-white border-0 hover:opacity-90">
          Calculate Costs
        </Button>
      </div>
    </div>
  )
}
