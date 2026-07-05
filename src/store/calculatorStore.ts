import { create } from "zustand"
import { trackEvent } from "@/lib/analytics"

export type Step1Data = { bedrooms: string; location: string }
export type Step2Data = { floorArea: string; floors: string }
export type Step3Data = { grade: string }
export type Step4Data = {
  pool: string
  garden: string
  security: string
  solar: string
}

interface CalculatorStore {
  step: number
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  step4: Step4Data
  estimate: number | null
  hasEmail: boolean
  email: string
  sessionId: string | null
  setStep: (step: number) => void
  setStep1: (data: Step1Data) => void
  setStep2: (data: Step2Data) => void
  setStep3: (data: Step3Data) => void
  setStep4: (data: Step4Data) => void
  setEstimate: (value: number | null) => void
  setEmail: (email: string) => void
  setHasEmail: (val: boolean) => void
  setSessionId: (id: string | null) => void
  reset: () => void
}

const initialState = {
  step: 1,
  step1: { bedrooms: "", location: "" },
  step2: { floorArea: "", floors: "Single Floor" },
  step3: { grade: "" },
  step4: { pool: "No Pool", garden: "No Garden", security: "Basic Security", solar: "No Solar" },
  estimate: null,
  hasEmail: false,
  email: "",
  sessionId: null,
}

export const useCalculatorStore = create<CalculatorStore>((set, get) => ({
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
  setEmail: (email) => set({ email }),
  setHasEmail: (val) => set({ hasEmail: val }),
  setSessionId: (id) => set({ sessionId: id }),
  reset: () => set(initialState),
}))
