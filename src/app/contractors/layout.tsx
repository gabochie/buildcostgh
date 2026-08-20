import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Construction Contractors in Ghana — Verified Directory | BuildCost GH",
  description:
    "Browse our directory of construction contractors in Ghana. Verified builders, architects, and engineers across all 16 regions.",
  keywords: [
    "construction contractors Ghana",
    "builders in Ghana",
    "architects Ghana",
    "building contractors directory",
  ],
  alternates: { canonical: "/contractors" },
  openGraph: {
    title: "Construction Contractors Directory — BuildCost GH",
    description: "Browse verified construction contractors across all 16 regions.",
    type: "website",
  },
}

export default function ContractorsLayout({ children }: { children: React.ReactNode }) {
  return children
}
