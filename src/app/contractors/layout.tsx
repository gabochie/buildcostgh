import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Find Verified Contractors in Ghana - BuildCost GH",
  description: "Browse and connect with verified contractors across all 16 regions of Ghana. Compare ratings, experience, and specialties to find the right builder for your project.",
  openGraph: {
    title: "Find Verified Contractors in Ghana - BuildCost GH",
    description: "Browse and connect with verified contractors across all 16 regions of Ghana.",
  },
}

export default function ContractorsLayout({ children }: { children: React.ReactNode }) {
  return children
}