import type { Metadata } from "next"
import { JsonLd } from "@/components/seo/JsonLd"
import { pricingFaqs } from "@/lib/seo/faqs"

export const metadata: Metadata = {
  title: "Pricing - Construction Cost Reports & Subscriptions | BuildCost GH",
  description: "Choose from one-time reports or unlimited subscriptions. Free trial available. Pay with card or mobile money. $29 per report or $19/month unlimited.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing - BuildCost GH",
    description: "Choose from one-time reports or unlimited subscriptions. Free trial available. Pay with card or mobile money.",
    images: [{ url: "/assets/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing - BuildCost GH",
    description: "Choose from one-time reports or unlimited subscriptions. Free trial available. Pay with card or mobile money.",
    images: ["/assets/og-image.jpg"],
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pricingFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      {children}
    </>
  )
}