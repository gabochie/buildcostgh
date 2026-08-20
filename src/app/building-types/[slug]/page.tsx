import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Building2, ArrowRight, CheckCircle } from "lucide-react"
import { JsonLd } from "@/components/seo/JsonLd"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.buildingCategory.findUnique({
    where: { slug, isActive: true },
    include: { subtypes: { where: { isActive: true }, select: { name: true } } },
  })

  if (!category) return { title: "Building Type Not Found" }

  const title = `${category.name} Building Cost Calculator Ghana | BuildCost GH`
  const description = `Estimate construction costs for ${category.name.toLowerCase()} buildings in Ghana. ${category.description}. Get instant cost estimates, permit requirements, and professional fees.`
  const subtypes = category.subtypes.map(s => s.name).join(", ")

  return {
    title,
    description,
    keywords: [
      `${category.name.toLowerCase()} building cost Ghana`,
      `${category.name.toLowerCase()} construction cost Ghana`,
      `how much to build ${category.name.toLowerCase()} Ghana`,
      subtypes.toLowerCase(),
      "building cost calculator Ghana",
    ],
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

export default async function BuildingTypePage({ params }: Props) {
  const { slug } = await params

  const category = await prisma.buildingCategory.findUnique({
    where: { slug, isActive: true },
    include: {
      subtypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      costProfiles: { where: { isActive: true, subtypeId: null } },
    },
  })

  if (!category) notFound()

  const costRange = category.costProfiles.length > 0
    ? {
        low: Math.min(...category.costProfiles.map(p => Number(p.baseCostPerSqm))),
        high: Math.max(...category.costProfiles.map(p => Number(p.baseCostPerSqm))),
      }
    : null

  const iconMap: Record<string, string> = {
    home: "🏠", "building-2": "🏢", hotel: "🏨", factory: "🏭",
    warehouse: "📦", "graduation-cap": "🎓", heart: "🏥", landmark: "🏛️",
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: `${category.name} Building Cost Calculator Ghana`,
          description: category.description,
          url: `https://buildcostgh.com/building-types/${slug}`,
        }}
      />

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-5xl mb-4">{iconMap[category.icon || ""] || "🏗️"}</div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-charcoal mb-4">
              {category.name} Building Cost Calculator
            </h1>
            <p className="text-lg text-gray-600 mb-8">{category.description}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/calculator?buildingType=${slug}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
              >
                Get Cost Estimate <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border border-gray-300 hover:border-emerald-300 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                View All Building Types
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Overview */}
      {costRange && (
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                Indicative Cost Range
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Economy</div>
                  <div className="text-2xl font-bold text-gray-900">
                    GHS {Math.round(costRange.low * 0.7).toLocaleString()}/m²
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-sm text-emerald-600 mb-1 font-medium">Standard</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    GHS {Math.round(costRange.low).toLocaleString()}/m²
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Premium</div>
                  <div className="text-2xl font-bold text-gray-900">
                    GHS {Math.round(costRange.high).toLocaleString()}/m²
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Subtypes */}
      {category.subtypes.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
                {category.name} Building Types
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {category.subtypes.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">{sub.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {sub.typicalMinFloors}–{sub.typicalMaxFloors} floors · Complexity: {sub.complexity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-emerald-50 rounded-2xl p-8 border border-emerald-200">
            <Building2 className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-bold text-charcoal mb-3">
              Ready to Estimate Your {category.name} Project?
            </h2>
            <p className="text-gray-600 mb-6">
              Get an instant cost estimate with elemental breakdown, professional fees, and permit intelligence.
            </p>
            <Link
              href={`/calculator?buildingType=${slug}`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
            >
              Start Calculation <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
