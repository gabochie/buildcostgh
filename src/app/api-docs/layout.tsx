import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation - BuildCost GH Developer API",
  description: "Integrate real-time Ghana construction cost estimates into your platform. REST API with authentication, usage tracking, and developer-friendly pricing.",
  openGraph: {
    title: "API Documentation - BuildCost GH",
    description: "Integrate real-time Ghana construction cost estimates into your platform.",
  },
}

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}