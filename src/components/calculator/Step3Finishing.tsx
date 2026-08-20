"use client"

import { Button } from "@/components/ui/button"
import { useCalculatorStore } from "@/store/calculatorStore"

const grades = [
  {
    id: "C",
    name: "Grade C",
    tag: "Budget",
    price: "GHS 3,200 - 4,500 / m²",
    features: ["Basic ceramic tiles", "Standard fixtures", "Simple paint finish", "Basic kitchen fittings"],
  },
  {
    id: "B",
    name: "Grade B",
    tag: "Standard",
    price: "GHS 5,500 - 8,000 / m²",
    features: ["Premium ceramic tiles", "Quality fixtures", "Emulsion paint finish", "Modern kitchen fittings"],
    popular: true,
  },
  {
    id: "A",
    name: "Grade A",
    tag: "Premium",
    price: "GHS 9,500 - 18,000 / m²",
    features: ["Marble/Granite floors", "Luxury fixtures", "Premium paint finish", "High-end kitchen fittings"],
  },
]

export function Step3Finishing() {
  const { step3, setStep3, setStep } = useCalculatorStore()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Finishing Quality</h2>
        <p className="text-sm text-gray-500">Step 5 of 7</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {grades.map((grade) => (
          <button
            key={grade.id}
            type="button"
            onClick={() => setStep3({ grade: grade.id })}
            className={`relative text-left p-6 rounded-xl border-2 transition-all ${
              step3.grade === grade.id
                ? "border-emerald-600 bg-emerald-50 shadow-glow-emerald"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            {grade.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-gold text-charcoal text-xs font-bold rounded-full whitespace-nowrap">
                Most Popular
              </span>
            )}
            <div className="font-bold text-lg text-gray-900">{grade.name}</div>
            <div className="text-sm font-medium text-emerald-600 mb-1">{grade.tag}</div>
            <div className="text-sm text-gray-500 mb-3">{grade.price}</div>
            <ul className="space-y-1.5">
              {grade.features.map((f) => (
                <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(2)}>
          Previous
        </Button>
        <Button
          onClick={() => setStep(5)}
          disabled={!step3.grade}
          className="bg-gradient-primary text-white border-0 hover:opacity-90"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
