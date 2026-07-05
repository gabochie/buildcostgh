import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Free Construction Cost Calculator - BuildCost GH",
  description: "Get an instant, accurate construction cost estimate for your Ghana building project. Free to use — no credit card required. Estimate by room, materials, or all-in.",
  alternates: {
    canonical: "/calculator",
  },
  openGraph: {
    title: "Free Construction Cost Calculator - BuildCost GH",
    description: "Get an instant, accurate construction cost estimate for your Ghana building project. Free to use — no credit card required.",
    images: [{ url: "/assets/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Construction Cost Calculator - BuildCost GH",
    description: "Get an instant, accurate construction cost estimate for your Ghana building project. Free to use — no credit card required.",
    images: ["/assets/og-image.jpg"],
  },
}

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children
}