import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing — Ghana Construction Cost Estimates | BuildCost GH",
  description:
    "Choose your plan. Basic estimates from $29, Detailed from $79, Premium from $199. MTN MoMo billing in GHS for locals, USD for diaspora.",
  keywords: [
    "buildcostgh pricing",
    "Ghana construction estimate cost",
    "building cost report price",
  ],
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — BuildCost GH",
    description: "Choose your plan. Basic $29, Detailed $79, Premium $199.",
    type: "website",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
