import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing - Construction Cost Reports & Subscriptions | BuildCost GH",
  description: "Choose from one-time reports or unlimited subscriptions. Free trial available. Pay with card or mobile money. $29 per report or $19/month unlimited.",
  openGraph: {
    title: "Pricing - BuildCost GH",
    description: "Choose from one-time reports or unlimited subscriptions. Free trial available. Pay with card or mobile money.",
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}