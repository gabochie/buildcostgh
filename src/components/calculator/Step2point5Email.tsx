"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCalculatorStore } from "@/store/calculatorStore"
import { Mail, Lock, Loader2, Shield, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function Step2point5Email() {
  const { step1, step2, email, setEmail, setHasEmail, setStep } = useCalculatorStore()
  const [loading, setLoading] = useState(false)
  const [localEmail, setLocalEmail] = useState(email)

  const handleSubmit = async () => {
    if (!localEmail || !localEmail.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/calculator/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: localEmail,
          bedrooms: step1.bedrooms,
          location: step1.location,
          floorArea: step2.floorArea,
          floors: step2.floors,
        }),
      })

      if (res.ok) {
        setEmail(localEmail)
        setHasEmail(true)
        setStep(3)
      } else {
        // Still let them proceed even if save fails
        setEmail(localEmail)
        setHasEmail(true)
        setStep(3)
      }
    } catch {
      setEmail(localEmail)
      setHasEmail(true)
      setStep(3)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary text-white flex items-center justify-center mx-auto mb-4">
          <Mail className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Save Your Progress</h2>
        <p className="text-sm text-gray-500">Enter your email to unlock your full estimate and save your progress</p>
      </div>

      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-emerald-800">
            <strong>Your estimate is ready!</strong> Enter your email to see the full breakdown, compare regions, and get tips to save money.
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          value={localEmail}
          onChange={(e) => setLocalEmail(e.target.value)}
          placeholder="your@email.com"
          className="h-12 text-base"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <p className="text-xs text-gray-400">We&apos;ll save your progress. No spam, unsubscribe anytime.</p>
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> SSL Secured</span>
        <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> No spam</span>
        <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Privacy guaranteed</span>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(2)}>
          Previous
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !localEmail} className="bg-gradient-primary text-white border-0 hover:opacity-90">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            "Continue to Your Estimate"
          )}
        </Button>
      </div>
    </div>
  )
}
