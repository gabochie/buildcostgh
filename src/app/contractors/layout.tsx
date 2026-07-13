import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Find Verified Contractors in Ghana - BuildCost GH",
  description: "Browse and connect with verified contractors across all 16 regions of Ghana. Compare ratings, experience, and specialties to find the right builder for your project.",
  alternates: {
    canonical: "/contractors",
  },
  openGraph: {
    title: "Find Verified Contractors in Ghana - BuildCost GH",
    description: "Browse and connect with verified contractors across all 16 regions of Ghana.",
    images: [{ url: "/assets/og-image.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Verified Contractors in Ghana - BuildCost GH",
    description: "Browse and connect with verified contractors across all 16 regions of Ghana.",
    images: ["/assets/og-image.jpg"],
  },
}

export default function ContractorsLayout({ children }: { children: React.ReactNode }) {
  return children
}