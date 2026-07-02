"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useCalculatorStore } from "@/store/calculatorStore"

export function Step2FloorSize() {
  const { step2, setStep2, setStep } = useCalculatorStore()
  const floors = ["Single Floor", "Two Floors", "Three Floors"]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Floor Size</h2>
        <p className="text-sm text-gray-500">Step 2 of 5</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="floorArea">Total Floor Area (m&sup2;)</Label>
        <Input
          id="floorArea"
          type="number"
          placeholder="e.g. 200"
          value={step2.floorArea}
          onChange={(e) => setStep2({ ...step2, floorArea: e.target.value })}
          className="max-w-xs"
        />
        <p className="text-xs text-gray-400">Typical range: 100-500 m&sup2; for residential</p>
      </div>

      <div className="space-y-2">
        <Label>Number of Floors</Label>
        <div className="flex gap-2 flex-wrap">
          {floors.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStep2({ ...step2, floors: f })}
              className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${
                step2.floors === f
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => setStep(1)}>
          Previous
        </Button>
        <Button
          onClick={() => setStep(3)}
          disabled={!step2.floorArea}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
