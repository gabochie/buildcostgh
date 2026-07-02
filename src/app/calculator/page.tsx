"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Step1BasicInfo } from "@/components/calculator/Step1BasicInfo"
import { Step2FloorSize } from "@/components/calculator/Step2FloorSize"
import { Step2point5Email } from "@/components/calculator/Step2point5Email"
import { Step3Finishing } from "@/components/calculator/Step3Finishing"
import { Step4Addons } from "@/components/calculator/Step4Addons"
import { Step5Result } from "@/components/calculator/Step5Result"
import { useCalculatorStore } from "@/store/calculatorStore"
import { Hammer } from "lucide-react"

const stepLabels = ["Basic Info", "Floor Size", "Save", "Finishing", "Add-ons", "Estimate"]

const stepComponents: Record<number, React.ReactNode> = {
  1: <Step1BasicInfo />,
  2: <Step2FloorSize />,
  3: <Step2point5Email />,
  4: <Step3Finishing />,
  5: <Step4Addons />,
  6: <Step5Result />,
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
}

export default function CalculatorPage() {
  const { step } = useCalculatorStore()
  const totalSteps = Object.keys(stepComponents).length
  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Hammer className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-charcoal">Construction Cost Calculator</h1>
            </div>
            <p className="text-gray-500">Get instant estimates for your residential construction project</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{progress}% complete</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors flex-shrink-0 ${
                    step > i + 1
                      ? "bg-emerald-600 text-white"
                      : step === i + 1
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs whitespace-nowrap hidden sm:inline ${step === i + 1 ? "font-medium text-gray-900" : "text-gray-400"}`}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && <div className="w-4 h-px bg-gray-300 hidden sm:block" />}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-glass-lg border border-gray-100 p-6 md:p-8">
            <AnimatePresence mode="wait" custom={step}>
              <motion.div
                key={step}
                custom={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {stepComponents[step]}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
