import { create } from "zustand"

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

export const useCalculatorStore = create<CalculatorStore>((set) => ({
  ...initialState,
  setStep: (step) => set({ step }),
  setStep1: (data) => set({ step1: data }),
  setStep2: (data) => set({ step2: data }),
  setStep3: (data) => set({ step3: data }),
  setStep4: (data) => set({ step4: data }),
  setEstimate: (value) => set({ estimate: value }),
  setEmail: (email) => set({ email }),
  setHasEmail: (val) => set({ hasEmail: val }),
  setSessionId: (id) => set({ sessionId: id }),
  reset: () => set(initialState),
}))
