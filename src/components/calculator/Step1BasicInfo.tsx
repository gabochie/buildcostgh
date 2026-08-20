"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useCalculatorStore } from "@/store/calculatorStore"
import { Building2 } from "lucide-react"

const bedrooms = ["1", "2", "3", "4", "5", "6+"]
const locations = [
  "Accra", "Kumasi", "Tema", "Takoradi", "Tamale",
  "Cape Coast", "Sunyani", "Ho", "Koforidua", "Bolgatanga",
  "Wa", "Goaso", "Techiman", "Dambai", "Sefwi Wiawso",
  "Nalerigu", "Damongo",
]

export function Step1BasicInfo() {
  const { step1, setStep1, setStep, buildingType } = useCalculatorStore()
  const isResidential = !buildingType || buildingType.categorySlug === "residential"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {isResidential ? "Basic Information" : "Project Location"}
        </h2>
        <p className="text-sm text-gray-500">Step 2 of 8</p>
      </div>

      {!isResidential && buildingType && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-lg border border-emerald-100 text-sm text-emerald-700">
          <Building2 className="h-4 w-4" />
          <span>
            {buildingType.categoryName}
            {buildingType.subtypeName && <span className="text-emerald-500"> · {buildingType.subtypeName}</span>}
          </span>
        </div>
      )}

      {isResidential && (
        <div className="space-y-2">
          <Label>Number of Bedrooms</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {bedrooms.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setStep1({ ...step1, bedrooms: b })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                  step1.bedrooms === b
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
                }`}
              >
                {b} {b === "1" ? "Bed" : "Beds"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>{isResidential ? "Location" : "Building Location"}</Label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {locations.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setStep1({ ...step1, location: loc })}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                step1.location === loc
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(0)}>
          Previous
        </Button>
        <Button
          onClick={() => setStep(2)}
          disabled={isResidential ? (!step1.bedrooms || !step1.location) : !step1.location}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
