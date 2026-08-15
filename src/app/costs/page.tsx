import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { MapPin, ArrowRight, CheckCircle, Database, Globe, Gauge, Fuel, Users } from "lucide-react"
import { JsonLd } from "@/components/seo/JsonLd"
import { FaqSection } from "@/components/seo/FaqSection"
import { estimateFor, fmtGhs, RATE_LABELS } from "@/lib/rates"
import type { Faq } from "@/lib/seo/faqs"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ghana Building Costs by Region — 2026 Rate Database | BuildCost GH",
  description:
    "Live construction cost data for all 16 regions of Ghana. Compare cement, iron rods, sand, labour and diesel prices per region, plus 3-bedroom house cost estimates. Updated monthly.",
  alternates: { canonical: "/costs" },
  keywords: ["cost of building in Ghana", "Ghana building costs by region", "construction rates Ghana 2026", "cement price Ghana", "building materials prices Ghana"],
  openGraph: {
    title: "Ghana Building Costs by Region — 2026 Rate Database | BuildCost GH",
    description:
      "Live construction cost data for all 16 regions of Ghana. Compare cement, iron rods, sand, labour and diesel prices per region, plus 3-bedroom house cost estimates. Updated monthly.",
    type: "website",
  },
}

const faqs: Faq[] = [
  {
    q: "Which region is cheapest to build in Ghana?",
    a: "The North East Region (around Nalerigu) is currently the cheapest to build in, at about 0.63x Accra prices. Upper East, Savannah and Upper West follow closely. Greater Accra is the most expensive baseline, with Ashanti and Western in the middle.",
  },
  {
    q: "How much does a 3-bedroom house cost in Ghana by region?",
    a: "A standard 3-bedroom house costs roughly GHS 650,000–1,000,000 in Accra. Multiplying by each region's cost factor: Ashanti about GHS 550,000–850,000, Northern (Tamale) about GHS 455,000–700,000, and North East about GHS 410,000–630,000. See each region page for exact ranges.",
  },
  {
    q: "How does BuildCost GH source its regional rate data?",
    a: "Rates come from supplier surveys, NPA fuel benchmarks, and BuildCost GH field data collected across all 16 regions, reviewed monthly. Every region page lists the source and last update date.",
  },
  {
    q: "Why do building costs differ between regions in Ghana?",
    a: "Labour rates vary by as much as 40% between regions, material transport adds 10–25% in remote areas, permit fees differ by municipality, and material availability (e.g. cement from Tema, rebar in Kumasi) shifts prices.",
  },
  {
    q: "Can I get a personalized estimate for my region?",
    a: "Yes. Use the free BuildCost GH calculator — it automatically applies the correct regional cost factor for all 16 regions based on your location and project details.",
  },
]

export default async function CostsIndexPage() {
  const rates = await prisma.regionRate
    .findMany({ where: { published: true }, orderBy: [{ multiplier: "desc" }, { name: "asc" }] })
    .catch(() => [])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

  const national = rates.length
    ? {
        cement: Math.round(rates.reduce((s, r) => s + r.cementBag, 0) / rates.length),
        labour: Math.round(rates.reduce((s, r) => s + r.labourRate, 0) / rates.length),
        diesel: Math.round(rates.reduce((s, r) => s + r.dieselLit, 0) / rates.length),
      }
    : null

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Dataset",
            name: "Ghana Construction Cost Rates by Region 2026",
            description: "Construction material and labour rates for all 16 regions of Ghana, updated monthly.",
            url: `${baseUrl}/costs`,
            creator: { "@type": "Organization", name: "BuildCost GH", url: baseUrl },
            dateModified: rates[0]?.updatedAt.toISOString(),
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

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 text-emerald-300 text-sm font-semibold mb-4">
              <Database className="h-4 w-4" /> Live rate database · updated {rates[0] ? `monthly · last ${rates[0].updatedAt.toISOString().slice(0, 10)}` : "monthly"}
            </span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
              Ghana Building Costs by Region
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-6">
              Construction material and labour rates for all {rates.length} regions of Ghana. Cement, iron rods, sand,
              granite, timber, roofing, diesel and skilled labour — compared side by side and updated monthly from real market data.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/calculator"
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Get my free estimate <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#rates"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <MapPin className="h-4 w-4" /> Explore 16 regions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* National highlights */}
      {national && (
        <section className="container mx-auto px-4 -mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Globe, label: "National average cement", value: `${fmtGhs(national.cement)}/bag` },
              { icon: Users, label: "National average labour", value: `${fmtGhs(national.labour)}/day` },
              { icon: Fuel, label: "Diesel (NPA benchmark)", value: `${fmtGhs(national.diesel)}/L` },
              { icon: Gauge, label: "Regions covered", value: "16 of 16" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <s.icon className="h-5 w-5 text-emerald-600 mb-2" />
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Region grid */}
      <section id="rates" className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-heading font-bold text-slate-900">All 16 Regions</h2>
            <p className="text-sm text-gray-500 mt-1">
              Cost factor vs Accra (baseline 1.00) + indicative 3-bedroom standard build range
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rates.map((r) => {
            const est = estimateFor(r.multiplier)
            return (
              <Link
                key={r.slug}
                href={`/costs/${r.slug}`}
                className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-700">{r.name}</h3>
                    <p className="text-xs text-gray-500">{r.capital}</p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                    {r.multiplier.toFixed(2)}x
                  </span>
                </div>
                <div className="text-sm text-slate-700">
                  <p className="font-semibold">
                    3-bed standard:{" "}
                    <span className="text-emerald-700">{fmtGhs(est.min)}–{fmtGhs(est.max)}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Cement {fmtGhs(r.cementBag)}/bag · Labour {fmtGhs(r.labourRate)}/day
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600">
                  View rates <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Compare table */}
      <section className="bg-white border-y border-gray-200 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">Regional Rate Comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-left">
                  <th className="px-4 py-3 font-semibold">Region</th>
                  <th className="px-4 py-3 font-semibold">Capital</th>
                  <th className="px-4 py-3 font-semibold">Factor</th>
                  <th className="px-4 py-3 font-semibold">Cement</th>
                  <th className="px-4 py-3 font-semibold">Rebar/t</th>
                  <th className="px-4 py-3 font-semibold">Labour/day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rates.map((r) => (
                  <tr key={r.slug} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link href={`/costs/${r.slug}`} className="hover:text-emerald-700">
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.capital}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-emerald-700">{r.multiplier.toFixed(2)}x</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{fmtGhs(r.cementBag)}</td>
                    <td className="px-4 py-3 text-slate-700">{fmtGhs(r.rebarTon)}</td>
                    <td className="px-4 py-3 text-slate-700">{fmtGhs(r.labourRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Material prices", desc: `${RATE_LABELS.length} tracked line items per region — cement, rebar, blocks, sand, granite, timber, roofing, diesel, paint.` },
              { title: "Labour rates", desc: "Skilled artisan day rates by region, adjusted for local demand and availability." },
              { title: "Source & updates", desc: "Supplier surveys + NPA fuel benchmarks + BuildCost GH field data, reviewed monthly." },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-3 rounded-xl border border-gray-200 p-4">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{c.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-10 text-center text-white">
          <h2 className="text-3xl font-heading font-bold mb-3">Build with real numbers</h2>
          <p className="text-emerald-50 max-w-xl mx-auto mb-6">
            Get a free, itemized cost estimate for your project — automatically adjusted to your region's rates.
          </p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-white text-emerald-700 font-bold px-8 py-3.5 rounded-xl hover:bg-emerald-50 transition-colors"
          >
            <ArrowRight className="h-5 w-5" /> Use the free calculator
          </Link>
        </div>
      </section>

      <FaqSection faqs={faqs} title="Regional Cost FAQs" />
    </div>
  )
}
