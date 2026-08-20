import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Ghana Building Cost Intelligence API — Programmatic Access | BuildCost GH",
  description:
    "Access Ghana construction cost data via our REST API. Building types, locations, cost rates, and permit requirements. JSON responses, API key authentication.",
  keywords: ["Ghana construction API", "building cost API", "construction rates API"],
  alternates: { canonical: "/api-docs" },
  openGraph: {
    title: "BuildCost GH API — Programmatic Access",
    description: "Access Ghana construction cost data via REST API.",
    type: "website",
  },
}

export default function ApiDocsLayout({ children }: { children: React.ReactNode }) {
  return children
}
