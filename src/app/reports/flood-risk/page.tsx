"use client"

import { Printer, Download, ArrowRight, Shield, MapPin, Droplets, TrendingUp, CheckCircle, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"

const riskStyles: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: "Critical Risk", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
  high: { label: "High Risk", color: "text-orange-700 bg-orange-50 border-orange-200", dot: "bg-orange-500" },
  medium: { label: "Medium Risk", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500" },
  low: { label: "Low Risk", color: "text-lime-700 bg-lime-50 border-lime-200", dot: "bg-lime-500" },
  safe: { label: "Safe Zone", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
}

const regionSummaries = [
  { name: "Greater Accra", locations: 42, priceRange: "GHS 7,000 – GHS 4.5M", advice: "Avoid the Odaw basin. Invest in Tema Community 25, Sakumono, and Dodowa for flood-safe value." },
  { name: "Ashanti Region", locations: 16, priceRange: "GHS 25,000 – GHS 1.2M", advice: "Avoid Aboabo/Asawase. Nhyiaeso, Ridge, and the Boankra corridor are safest bets." },
  { name: "Central Region", locations: 10, priceRange: "GHS 10,000 – GHS 1.5M", advice: "Cape Coast hilltops are safe and scenic. Avoid low-lying coastal and lagoon areas." },
  { name: "Eastern Region", locations: 8, priceRange: "GHS 15,000 – GHS 500K", advice: "Akwapim Ridge and Aburi are the safest in Ghana. Premium diaspora demand." },
  { name: "Volta Region", locations: 6, priceRange: "GHS 10,000 – GHS 300K", advice: "Avoid Keta and Volta Lake shoreline. Amedzofe hills are naturally flood-safe." },
]

const ctaBlocks = [
  {
    icon: TrendingUp,
    title: "Get Your Construction Cost Estimate",
    desc: "Know exactly how much your dream home will cost to build in any region of Ghana. Free estimate in under 5 minutes.",
    href: "/calculator",
    label: "Calculate Your Build Cost",
  },
  {
    icon: Shield,
    title: "Compare Pricing Tiers",
    desc: "From a quick summary to a full 15-page professional report with contractor matching. Choose what fits your project.",
    href: "/pricing",
    label: "View Pricing",
  },
  {
    icon: MapPin,
    title: "Talk to a Construction Expert",
    desc: "Not sure where to start? Our team can help you plan your build, find contractors, and avoid costly mistakes.",
    href: "/contact",
    label: "Get Expert Help",
  },
]

export default function FloodRiskReportPage() {
  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .report-page { padding: 0 !important; }
          .print-break { page-break-before: always; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      {/* ── PRINT CONTROLS ── */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Shield className="h-4 w-4 text-emerald-600" />
            <span className="font-medium">BuildCost GH</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400">Flood Risk Report</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
              <Printer className="h-4 w-4" />
              Save as PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── COVER PAGE ── */}
      <section className="relative bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800 py-20 md:py-32">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-emerald-400 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-blue-400 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700/50 flex items-center justify-center mx-auto mb-6 border border-emerald-600/30">
            <Shield className="h-8 w-8 text-emerald-300" />
          </div>
          <p className="text-emerald-400 text-sm font-medium mb-4">BuildCost GH &bull; Exclusive Intelligence Report</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white max-w-3xl mx-auto leading-tight">
            The Complete Ghana Flood Risk &amp; Land Intelligence Report
          </h1>
          <p className="text-xl text-emerald-100/70 max-w-2xl mx-auto mt-4">
            Know exactly where to buy land in Ghana — and where to avoid. Every region analysed. Every location rated.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-emerald-200/60">
            <span>&copy; {new Date().getFullYear()} BuildCost GH</span>
            <span className="w-1 h-1 rounded-full bg-emerald-600" />
            <span>82+ locations analysed</span>
            <span className="w-1 h-1 rounded-full bg-emerald-600" />
            <span>Data sourced from NADMO, World Bank, GARID &amp; academic research</span>
          </div>
        </div>
      </section>

      {/* ── EXECUTIVE SUMMARY ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">Executive Summary</h2>
          </div>
          <div className="prose prose-slate max-w-none text-slate-700 space-y-4">
            <p className="text-lg leading-relaxed">
              Ghana&apos;s flooding crisis is not a natural disaster. It is a manufactured one — the result of rapid urbanisation, unchecked wetland development, and a systematic failure to enforce planning regulations. Over <strong>10,000 structures</strong> have been built within statutory buffer zones across just 16 assemblies studied by the GARID project.
            </p>
            <p className="text-lg leading-relaxed">
              The economic cost is staggering. The World Bank estimates <strong>US$200 million per year</strong> in flood-related losses — roughly 0.5% of Ghana&apos;s GDP. Over the decade 2013–2023, floods affected <strong>110,813 households</strong> and caused <strong>US$1.7 billion</strong> in economic losses. In Greater Accra alone, <strong>US$3.2 billion</strong> of economic assets are exposed to flood risk.
            </p>
            <p className="text-lg leading-relaxed">
              But here is the opportunity: <strong>flood-safe land exists at every price point.</strong> From GHS 7,000 plots in Prampram to GHS 3M+ estates in Cantonments, the key is knowing where to look — and where to avoid.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {[
              { val: "82+", label: "Locations Rated" },
              { val: "16", label: "Regions Covered" },
              { val: "US$200M", label: "Annual Flood Losses" },
              { val: "10,000+", label: "Illegal Buffer Structures" },
            ].map((s) => (
              <div key={s.label} className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-700">{s.val}</div>
                <div className="text-xs text-emerald-600">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mt-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-amber-900 text-sm">Critical Warning</p>
                <p className="text-sm text-amber-800 mt-1">The June 2026 Accra floods proved that even moderate rainfall (25mm) now overwhelms the city&apos;s drainage. The Ghana Institution of Engineering has declared flooding a &ldquo;structural challenge&rdquo; — not a seasonal one. Buying land without flood risk intelligence is no longer just risky. It is irresponsible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RISK LEGEND ── */}
      <section className="py-8 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="font-bold text-slate-900 mb-4 text-center">Flood Risk Classification</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { risk: "critical", label: "Critical", desc: "Floods every rainy season. Avoid." },
              { risk: "high", label: "High Risk", desc: "Frequent flooding. Only buy with extreme caution." },
              { risk: "medium", label: "Medium Risk", desc: "Floods in heavy rain. Check specific street." },
              { risk: "low", label: "Low Risk", desc: "Generally safe. Isolated ponding only." },
              { risk: "safe", label: "Safe Zone", desc: "Minimal flood risk. Best investment." },
            ].map((r) => (
              <div key={r.risk} className="bg-white rounded-xl border border-slate-200 p-3 text-center">
                <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${r.risk === "critical" ? "bg-red-500" : r.risk === "high" ? "bg-orange-500" : r.risk === "medium" ? "bg-amber-500" : r.risk === "low" ? "bg-lime-500" : "bg-emerald-500"}`} />
                <div className="text-sm font-bold text-slate-900">{r.label}</div>
                <div className="text-[10px] text-slate-500">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REGION-BY-REGION ── */}
      {regionSummaries.map((region, ri) => (
        <section key={region.name} className={`py-12 md:py-16 ${ri % 2 === 1 ? "bg-slate-50" : ""}`}>
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">{region.name} Region</h2>
                  <p className="text-sm text-slate-500">{region.locations} locations &bull; {region.priceRange}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-xl p-5 text-white mb-6">
              <p className="text-sm font-medium text-emerald-200 uppercase tracking-wider">Investment Advice</p>
              <p className="text-white font-medium mt-1">{region.advice}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="h-4 w-4 text-amber-700" />
                <span className="font-bold text-amber-900 text-sm">Ready to build in {region.name}?</span>
              </div>
              <p className="text-sm text-amber-800">Get an accurate cost estimate tailored to your project location.</p>
              <Link href="/calculator" className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-800 underline">
                Calculate your build cost now &rarr;
              </Link>
            </div>
          </div>
        </section>
      ))}

      {/* ── KEY TAKEAWAYS ── */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">Key Takeaways</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "The Odaw River basin in Accra is the single most dangerous place to build. Avoid Alajo, Nima, Odawna, Kaneshie, and Glefe completely.",
              "Flood-safe does not mean expensive. Tema Community 25 offers excellent safety at 30-50% below equivalent Accra pricing.",
              "The Akwapim Ridge and Aburi hills are Ghana's safest terrain — naturally elevated, excellent drainage, and growing diaspora demand.",
              "Land in NADMO-listed flood zones can be 20-30% cheaper than equivalent safe areas — for good reason. The discount is not worth the risk.",
              "Always verify land title at the Lands Commission. Flood-prone land is often also disputed land with multiple competing claims.",
              "Ghana loses US$200M annually to floods. Investing in flood-safe land is not just smart — it protects your capital from systemic risk.",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2.5 bg-white border border-slate-200 rounded-xl p-4">
                <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-slate-700">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTAs ── */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-800">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-3">Your Next Step</h2>
          <p className="text-emerald-100/60 mb-8 max-w-xl mx-auto">You have the flood intelligence. Now get the construction cost data you need to plan your project with confidence.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ctaBlocks.map((cta) => (
              <Link key={cta.href} href={cta.href} className="group bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-left hover:bg-white/20 transition-all">
                <cta.icon className="h-8 w-8 text-emerald-400 mb-3" />
                <h3 className="font-bold text-white mb-1">{cta.title}</h3>
                <p className="text-sm text-emerald-100/60 mb-3">{cta.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-300 group-hover:text-emerald-200">
                  {cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section className="py-8 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              <strong className="text-slate-600">Disclaimer:</strong> This report is for informational purposes only and does not constitute financial, legal, or investment advice. Flood risk data compiled from NADMO, GARID, World Bank, and academic sources as of July 2026. Land prices are market estimates. Always verify land title at the Lands Commission, conduct physical inspection, and consult a licensed professional before any land purchase.
              <br /><br />
              <Link href="/" className="text-emerald-600 hover:underline">&larr; Back to BuildCost GH</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
