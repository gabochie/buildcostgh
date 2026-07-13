import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Pricing - BuildCost GH Developer Plans",
  description: "Simple usage-based pricing for the BuildCost GH API. Free dev tier with 100 requests/month. Pro at $29/month. Enterprise custom plans available.",
  openGraph: {
    title: "API Pricing - BuildCost GH",
    description: "Simple usage-based pricing for the BuildCost GH API. Free dev tier available.",
  },
}

export default function ApiPricingLayout({ children }: { children: React.ReactNode }) {
  return children
}