import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Free Construction Cost Calculator - BuildCost GH",
  description: "Get an instant, accurate construction cost estimate for your Ghana building project. Free to use — no credit card required. Estimate by room, materials, or all-in.",
  openGraph: {
    title: "Free Construction Cost Calculator - BuildCost GH",
    description: "Get an instant, accurate construction cost estimate for your Ghana building project. Free to use — no credit card required.",
  },
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}