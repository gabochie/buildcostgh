import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Pricing - BuildCost GH Developer Plans",
  description: "Simple usage-based pricing for the BuildCost GH API. Free dev tier with 100 requests/month. Pro at $29/month. Enterprise custom plans available.",
  alternates: {
    canonical: "/api-pricing",
  },
  openGraph: {
    title: "API Pricing - BuildCost GH",
    description: "Simple usage-based pricing for the BuildCost GH API. Free dev tier available.",
    images: [{ url: "/assets/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "API Pricing - BuildCost GH",
    description: "Simple usage-based pricing for the BuildCost GH API. Free dev tier available.",
    images: ["/assets/og-image.jpg"],
  },
}

export default function ApiPricingLayout({ children }: { children: React.ReactNode }) {
  return children
}