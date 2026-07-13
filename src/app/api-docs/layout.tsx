import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation - BuildCost GH Developer API",
  description: "Integrate real-time Ghana construction cost estimates into your platform. REST API with authentication, usage tracking, and developer-friendly pricing.",
  alternates: {
    canonical: "/api-docs",
  },
  openGraph: {
    title: "API Documentation - BuildCost GH",
    description: "Integrate real-time Ghana construction cost estimates into your platform.",
    images: [{ url: "/assets/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "API Documentation - BuildCost GH",
    description: "Integrate real-time Ghana construction cost estimates into your platform.",
    images: ["/assets/og-image.jpg"],
  },
}

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}