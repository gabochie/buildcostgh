import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us — BuildCost GH | Get Help With Your Building Estimate",
  description:
    "Get in touch with BuildCost GH. Questions about your estimate, subscription, or need support? We respond within 24 hours.",
  keywords: ["contact buildcostgh", "buildcostgh support", "building cost help Ghana"],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Us — BuildCost GH",
    description: "Questions about your estimate or subscription? Get in touch.",
    type: "website",
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
