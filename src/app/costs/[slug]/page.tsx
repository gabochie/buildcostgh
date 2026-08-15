import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { ArrowLeft, ArrowRight, MapPin, Fuel, Users, Hammer, Database, CheckCircle } from "lucide-react"
import { JsonLd } from "@/components/seo/JsonLd"
import { FaqSection } from "@/components/seo/FaqSection"
import { estimateFor, fmtGhs, RATE_LABELS } from "@/lib/rates"
import type { Faq } from "@/lib/seo/faqs"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const r = await prisma.regionRate.findUnique({ where: { slug } })
  if (!r) return {}
  const est = estimateFor(r.multiplier)
  return {
    title: `Cost of Building in ${r.name} (${r.capital}) 2026 | BuildCost GH`,
    description: `How much it costs to build in ${r.name} Region in 2026. Cement, iron rods, labour, sand and diesel rates for ${r.capital}, plus a ${fmtGhs(est.min)}–${fmtGhs(est.max)} estimate for a 3-bedroom standard house.`,
    alternates: { canonical: `/costs/${r.slug}` },
    keywords: [
      `cost of building in ${r.name}`,
      `cost of building in ${r.capital}`,
      `${r.capital} building costs 2026`,
      `${r.name} construction rates`,
    ],
    openGraph: {
      title: `Cost of Building in ${r.name} (${r.capital}) 2026 | BuildCost GH`,
      description: `Cement, iron rods, labour, sand and diesel rates for ${r.capital} — plus a ${fmtGhs(est.min)}–${fmtGhs(est.max)} 3-bedroom estimate.`,
      type: "website",
    },
  }
}

export default async function RegionCostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const r = await prisma.regionRate.findUnique({ where: { slug } })
  if (!r || !r.published) notFound()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
  const standard = estimateFor(r.multiplier, "standard")
  const basic = estimateFor(r.multiplier, "basic")
  const premium = estimateFor(r.multiplier, "premium")
  const accraStandard = estimateFor(1, "standard")

  const faqs: Faq[] = [
    {
      q: `How much does it cost to build a 3-bedroom house in ${r.capital}?`,
      a: `A standard 3-bedroom house in ${r.name} Region typically costs between ${fmtGhs(standard.min)} and ${fmtGhs(standard.max)} (basic finish ${fmtGhs(basic.min)}–${fmtGhs(basic.max)}, premium ${fmtGhs(premium.min)}–${fmtGhs(premium.max)}). These figures exclude land, permits and architectural fees.`,
    },
    {
      q: `What are the building material prices in ${r.name} Region?`,
      a: `Cement costs around ${fmtGhs(r.cementBag)} per 50kg bag, iron rods about ${fmtGhs(r.rebarTon)} per tonne, and diesel ${fmtGhs(r.dieselLit)} per litre. See the full table above for blocks, sand, granite, timber, roofing and paint.`,
    },
    {
      q: `Is it cheaper to build in ${r.capital} than in Accra?`,
      a: `Yes. Build costs in ${r.name} Region are about ${Math.round((1 - r.multiplier) * 100)}% lower than the Accra baseline (${r.multiplier.toFixed(2)}x vs 1.00x). A standard 3-bedroom in Accra is ${fmtGhs(accraStandard.min)}–${fmtGhs(accraStandard.max)}.`,
    },
    {
      q: `How can I get an accurate estimate for building in ${r.capital}?`,
      a: `Use the free BuildCost GH calculator — it applies the ${r.name} cost factor automatically, then upgrade to a Detailed report for itemized material quantities and contractor contacts.`,
    },
  ]

  const rateRows = RATE_LABELS.map(({ key, label, unit }) => ({
    label,
    unit,
    value: r[key],
  }))

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
              { "@type": "ListItem", position: 2, name: "Building Costs by Region", item: `${baseUrl}/costs` },
              { "@type": "ListItem", position: 3, name: r.name, item: `${baseUrl}/costs/${r.slug}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Link href="/costs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> All regions
        </Link>

        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white rounded-3xl p-8 md:p-10 mb-8">
          <div className="flex flex-wrap items-center gap-2 text-emerald-300 text-sm mb-3">
            <MapPin className="h-4 w-4" />
            <span>{r.capital}, Ghana</span>
            <span className="text-slate-400">·</span>
            <span>Updated {r.updatedAt.toISOString().slice(0, 10)}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
            Cost of Building in {r.name}
          </h1>
          <p className="text-slate-300 max-w-2xl">
            {r.notes} Cost factor {r.multiplier.toFixed(2)}x the Accra baseline —{" "}
            {Math.round((1 - r.multiplier) * 100)}% cheaper than building in Greater Accra.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Basic finish", value: `${fmtGhs(basic.min)}–${fmtGhs(basic.max)}` },
              { label: "Standard finish", value: `${fmtGhs(standard.min)}–${fmtGhs(standard.max)}`, highlight: true },
              { label: "Premium finish", value: `${fmtGhs(premium.min)}–${fmtGhs(premium.max)}` },
            ].map((c) => (
              <div
                key={c.label}
                className={`rounded-xl p-4 ${c.highlight ? "bg-emerald-500/20 border border-emerald-400/40" : "bg-white/5 border border-white/10"}`}
              >
                <p className="text-xs text-slate-300">{c.label} — 3-bedroom house</p>
                <p className="text-lg font-bold mt-1">{c.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Rate table */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-8">
          <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
            <Database className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-heading font-bold text-slate-900">
              {r.name} — Material & Labour Rates
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            <div className="grid grid-cols-3 px-6 py-3 bg-slate-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Item</span>
              <span>Rate</span>
              <span>Unit</span>
            </div>
            <div className="grid grid-cols-3 px-6 py-3.5 text-sm">
              <span className="font-medium text-slate-900">Labour (skilled artisan)</span>
              <span className="font-bold text-emerald-700">{fmtGhs(r.labourRate)}</span>
              <span className="text-gray-500">per day</span>
            </div>
            {rateRows.map((row) => (
              <div key={row.label} className="grid grid-cols-3 px-6 py-3.5 text-sm">
                <span className="font-medium text-slate-900">{row.label}</span>
                <span className="font-bold text-emerald-700">{fmtGhs(row.value)}</span>
                <span className="text-gray-500">{row.unit}</span>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-slate-50 text-xs text-gray-500">
            {r.source}
          </div>
        </div>

        {/* Labour + fuel highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <Users className="h-5 w-5 text-emerald-600 mb-2" />
            <h3 className="font-semibold text-slate-900 text-sm">Skilled labour</h3>
            <p className="text-xs text-gray-600 mt-1">
              Around {fmtGhs(r.labourRate)}/day for skilled artisans in {r.capital}. Specialist trades (electricians, tilers) cost more.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <Fuel className="h-5 w-5 text-emerald-600 mb-2" />
            <h3 className="font-semibold text-slate-900 text-sm">Diesel & transport</h3>
            <p className="text-xs text-gray-600 mt-1">
              {fmtGhs(r.dieselLit)}/L (NPA benchmark) drives haulage. Sand and granite are {fmtGhs(r.sandTrip)} and {fmtGhs(r.graniteTrip)} per trip.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <Hammer className="h-5 w-5 text-emerald-600 mb-2" />
            <h3 className="font-semibold text-slate-900 text-sm">Cost factor</h3>
            <p className="text-xs text-gray-600 mt-1">
              {r.multiplier.toFixed(2)}x Accra — the calculator uses this factor automatically for accurate local estimates.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-8 text-center text-white mb-8">
          <h2 className="text-2xl font-heading font-bold mb-2">Get a {r.name}-specific estimate</h2>
          <p className="text-emerald-50 max-w-xl mx-auto mb-5 text-sm">
            Free instant estimate using {r.capital}&apos;s real rates — no credit card required.
          </p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-7 py-3 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            <ArrowRight className="h-5 w-5" /> Use the free calculator
          </Link>
        </div>

        {/* Other regions */}
        <div className="mb-8">
          <h2 className="text-xl font-heading font-bold text-slate-900 mb-4">Compare with other regions</h2>
          <div className="flex flex-wrap gap-2">
            {(await prisma.regionRate.findMany({ where: { published: true }, orderBy: { name: "asc" }, take: 16 })).map((other) => (
              <Link
                key={other.slug}
                href={`/costs/${other.slug}`}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  other.slug === r.slug
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" /> {other.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-sm text-emerald-900">
            Estimates exclude land, permits, architectural fees and utility connections — add 15–20% for these. Get an
            itemized <Link href="/pricing" className="font-semibold underline">Detailed report</Link> for budgeting and contractor comparison.
          </p>
        </div>
      </div>

      <FaqSection faqs={faqs} title={`${r.name} Building Cost FAQs`} />
    </div>
  )
}
