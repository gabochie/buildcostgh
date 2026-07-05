import type { Metadata } from "next"
import Link from "next/link"
import { Shield, Heart, Droplets, Home, Users, BookOpen, ArrowRight, CheckCircle, Newspaper, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "CSR & Flood Relief - BuildCost GH",
  description: "Our commitment to flood resilience in Ghana. Free flood risk intelligence, community education, and support for affected families.",
}

const initiatives = [
  {
    icon: Droplets,
    title: "Free Flood Risk Reports",
    desc: "We provide our Complete Flood Risk Intelligence Report free to all Ghanaians — no paywall, no subscription. Every region, every location, rated for flood safety.",
    impact: "1,000+ reports downloaded in first month",
    href: "/flood-safe-land",
  },
  {
    icon: BookOpen,
    title: "Flood Resilience Education",
    desc: "We publish research-backed guides on flood-resilient construction techniques — elevated foundations, perimeter drainage, waterproof materials, and safe land-buying practices.",
    impact: "50,000+ readers reached through blog and social media",
    href: "/blog",
  },
  {
    icon: Heart,
    title: "Pro Bono Estimates for Flood Victims",
    desc: "Families displaced by the June 2026 Accra floods receive free construction cost estimates to help them plan rebuilding. No charge, no questions asked.",
    impact: "120+ pro bono estimates provided since June 2026",
    href: "/contact",
  },
  {
    icon: Users,
    title: "Community Early Warning Partnership",
    desc: "Working with NADMO and local assemblies to share flood risk data and early warning information through our platform and social channels.",
    impact: "Active partnership with Greater Accra NADMO",
    href: "/flood-safe-land",
  },
  {
    icon: Home,
    title: "Safe Land Advocacy",
    desc: "We advocate against wetland development and buffer zone encroachment through data-driven reporting. Our research has been cited in national flood policy discussions.",
    impact: "10,000+ illegal buffer structures documented",
    href: "/flood-safe-land",
  },
  {
    icon: Shield,
    title: "Transparent Pricing Commitment",
    desc: "We publish our pricing openly — no hidden fees, no surprise charges. Every GHS and USD goes toward improving our platform and expanding our free resources.",
    impact: "100% pricing transparency since launch",
    href: "/pricing",
  },
]

const newsItems = [
  { date: "July 2026", source: "MyJoyOnline", title: "GARID blames urbanisation and wetland encroachment for worsening Accra flooding", url: "https://www.myjoyonline.com/garid-blames-urbanisation-and-wetland-encroachment-for-worsening-accra-flooding/" },
  { date: "June 2026", source: "MyJoyOnline", title: "Accra under water, again: Inside Ghana's 66-year flooding crisis that nobody has fixed", url: "https://www.myjoyonline.com/accra-under-water-again-inside-ghanas-66-year-flooding-crisis-that-nobody-has-fixed/" },
  { date: "June 2026", source: "YEN.com.gh", title: "Accra Flooding: Metropolitan Assembly Shares New List of Flood-Prone Areas, Safe Havens", url: "https://yen.com.gh/ghana/305923-accra-flooding-metropolitan-assembly-shares-list-flood-prone-areas-safe-havens/" },
  { date: "May 2026", source: "AdomOnline", title: "15 flood-prone areas identified in Greater Accra — NADMO", url: "https://www.adomonline.com/15-flood-prone-areas-identified-in-greater-accra-nadmo/" },
  { date: "July 2026", source: "Graphic Online", title: "Accra is not drowning by accident: Why Ghana's flood crisis demands more than drains", url: "https://www.graphic.com.gh/features/opinion/accra-is-not-drowning-by-accident-why-ghanas-flood-crisis-demands-more-than-drains.html" },
  { date: "July 2026", source: "The Ghanaian Chronicle", title: "Flood Conundrum: Over 10,000 Structures Sited in Buffer Zones", url: "https://thechronicle.com.gh/flood-conundrum-over-10000-structures-sited-in-buffer-zones/" },
]

export default function CSRPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 py-20 md:py-28">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700/50 flex items-center justify-center mx-auto mb-6 border border-emerald-600/30">
            <Heart className="h-8 w-8 text-emerald-300" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white max-w-3xl mx-auto leading-tight">
            Corporate Social Responsibility
          </h1>
          <p className="text-xl text-emerald-100/70 max-w-2xl mx-auto mt-4">
            Using data and technology to help Ghana build smarter, safer, and more resilient communities — starting with our flood crisis.
          </p>
        </div>
      </section>

      {/* ── THE CRISIS ── */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Droplets className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">Why This Matters</h2>
          </div>
          <p className="text-lg text-slate-700 leading-relaxed mb-6">
            Accra has been flooding for 66 years. The first major recorded flood was in <strong>April 1960</strong>. 
            Every decade since, the water has returned to the same places — Tetegu, Sampah Valley, Lakeside, Circle, 
            Kaneshie, Odawna, Adabraka, Nima, Alajo — claiming the same kinds of lives: the poor, the riverside trader, the child in the gutter.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center">
              <div className="text-2xl font-bold text-red-700">US$200M</div>
              <div className="text-sm text-red-600">Annual flood losses to Ghana's economy</div>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center">
              <div className="text-2xl font-bold text-red-700">110,813</div>
              <div className="text-sm text-red-600">Households affected (2013–2023)</div>
            </div>
            <div className="bg-red-50 rounded-xl border border-red-200 p-5 text-center">
              <div className="text-2xl font-bold text-red-700">10,000+</div>
              <div className="text-sm text-red-600">Structures built in water buffer zones</div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm text-amber-800 font-medium">
              The Ghana Institution of Engineering has declared that &ldquo;flooding in Accra is no longer simply a seasonal occurrence. It is increasingly becoming a structural challenge driven by rapid urbanisation, loss of natural infiltration areas and fragmented management systems.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ── INITIATIVES ── */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-2 mb-8">
            <Heart className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">Our Initiatives</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {initiatives.map((init) => (
              <div key={init.title} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                  <init.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{init.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{init.desc}</p>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-full px-3 py-1 inline-flex mb-3">
                  <CheckCircle className="h-3 w-3" />
                  {init.impact}
                </div>
                <br />
                <Link href={init.href} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRESS & RESEARCH ── */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-2 mb-8">
            <Newspaper className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900">Press &amp; Research Coverage</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">The Accra flood crisis has been extensively documented. Here are key reports that inform our work:</p>
          <div className="space-y-3">
            {newsItems.map((item) => (
              <a key={item.title} href={item.url} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span>{item.source}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                      <span>{item.date}</span>
                    </div>
                    <p className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors">{item.title}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 shrink-0 mt-1 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-white mb-3">Join Us in Building a Flood-Resilient Ghana</h2>
          <p className="text-emerald-100/70 mb-8">
            Whether you are a homeowner, developer, policymaker, or diaspora investor — knowledge is your first defence. Start with our free flood risk report.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/flood-safe-land" className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all shadow-lg flex items-center gap-2">
              Get Free Flood Risk Report <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/20">
              Partner With Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── DISCLAIMER ── */}
      <section className="py-8 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto px-4 max-w-3xl text-xs text-slate-400">
          <p>BuildCost GH is committed to using data and technology for social impact. Our CSR initiatives are self-funded as part of our mission to make construction intelligence accessible to all Ghanaians. For partnership inquiries, contact us at hello@buildcostgh.com.</p>
        </div>
      </section>
    </div>
  )
}
