import { create } from "zustand"
import { persist } from "zustand/middleware"
import { useEffect, useState } from "react"
import { trackEvent } from "@/lib/analytics"
import type { EstimateResult } from "@/types"

export type Step1Data = { bedrooms: string; location: string }
export type Step2Data = { floorArea: string; floors: string }
export type Step3Data = { grade: string }
export type Step4Data = {
  pool: string
  garden: string
  security: string
  solar: string
  parking: string
  backupPower: string
  hvac: string
  dataInfra: string
}

export type BuildingTypeSelection = {
  categorySlug: string
  categoryName: string
  subtypeSlug: string | null
  subtypeName: string | null
}

interface CalculatorStore {
  step: number
  buildingType: BuildingTypeSelection | null
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
  estimate: number | null
  result: EstimateResult | null
  hasEmail: boolean
  email: string
  sessionId: string | null
  setStep: (step: number) => void
  setBuildingType: (bt: BuildingTypeSelection | null) => void
  setStep1: (data: Step1Data) => void
  setStep2: (data: Step2Data) => void
  setStep3: (data: Step3Data) => void
  setStep4: (data: Step4Data) => void
  setEstimate: (value: number | null) => void
  setResult: (result: EstimateResult | null) => void
  setEmail: (email: string) => void
  setHasEmail: (val: boolean) => void
  setSessionId: (id: string | null) => void
  reset: () => void
}

const initialState = {
  step: 1,
  buildingType: null as BuildingTypeSelection | null,
  step1: { bedrooms: "", location: "" },
  step2: { floorArea: "", floors: "Single Floor" },
  step3: { grade: "" },
  step4: {
    pool: "No Pool", garden: "No Garden", security: "Basic Security", solar: "No Solar",
    parking: "No Parking", backupPower: "No Backup", hvac: "No HVAC", dataInfra: "No Data",
  },
  estimate: null,
  result: null,
  hasEmail: false,
  email: "",
  sessionId: null,
}

export const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setStep: (step) => {
        const prev = get().step
        set({ step })
        if (step === 2 && prev === 1) trackEvent("calculator_step_completed", { step: 1 })
        if (step === 3 && prev === 2) trackEvent("calculator_step_completed", { step: 2 })
        if (step === 4 && prev === 3) {
          trackEvent("calculator_step_completed", { step: 3 })
          trackEvent("email_captured")
        }
        if (step === 5 && prev === 4) trackEvent("calculator_step_completed", { step: 4 })
        if (step === 6 && prev === 5) trackEvent("calculator_step_completed", { step: 5 })
      },
      setStep1: (data) => { set({ step1: data }); if (get().step === 1) trackEvent("calculator_started") },
      setStep2: (data) => set({ step2: data }),
      setStep3: (data) => set({ step3: data }),
      setStep4: (data) => set({ step4: data }),
      setEstimate: (value) => { set({ estimate: value }); if (value !== null) trackEvent("estimate_viewed", { value }) },
      setResult: (result) => set({ result }),
      setEmail: (email) => set({ email }),
      setHasEmail: (val) => set({ hasEmail: val }),
      setSessionId: (id) => set({ sessionId: id }),
      reset: () => set(initialState),
    }),
    {
      name: "buildcost-calculator",
      // Do NOT rehydrate synchronously at store creation: on the server there is no
      // localStorage (initial state renders), but on the client the persisted step
      // would already be applied during the FIRST render -> hydration mismatch (#418).
      // Rehydration is triggered manually client-side via useHasHydrated / Providers.
      skipHydration: true,
      partialize: (state) => ({
        step: state.step,
        step1: state.step1,
        step2: state.step2,
        step3: state.step3,
        step4: state.step4,
        estimate: state.estimate,
        result: state.result,
        hasEmail: state.hasEmail,
        email: state.email,
      }),
    }
  )
)

/**
 * True once persisted state is rehydrated on the client. False during server
 * render and the first client render, so gating UI on it prevents hydration
 * mismatches (the store starts from initial state on both).
 */
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const unsub = useCalculatorStore.persist.onFinishHydration(() => setHasHydrated(true))
    useCalculatorStore.persist.rehydrate()
    return unsub
  }, [])

  return hasHydrated
}
