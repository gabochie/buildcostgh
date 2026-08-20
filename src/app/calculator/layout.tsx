import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Building Cost Calculator Ghana — Instant Construction Estimate | BuildCost GH",
  description:
    "Calculate your building construction cost in Ghana instantly. Covers all 16 regions, 13 building types, and 3 quality levels. Get elemental breakdown, professional fees, and permit requirements.",
  keywords: [
    "building cost calculator Ghana",
    "construction cost estimate Ghana",
    "how much does it cost to build in Ghana",
    "building estimate tool Ghana",
  ],
  alternates: { canonical: "/calculator" },
  openGraph: {
    title: "Building Cost Calculator Ghana | BuildCost GH",
    description: "Calculate your building construction cost in Ghana instantly.",
    type: "website",
  },
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
