import type { Metadata } from "next"
import Link from "next/link"
import { Hammer, TrendingUp, Users, BarChart3, Globe, Shield, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Investors - BuildCost GH",
  description: "Invest in the leading construction cost estimation platform for Ghana and the African diaspora.",
}

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <TrendingUp className="h-7 w-7 text-gold" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Invest in BuildCost GH</h1>
          <p className="text-lg text-emerald-100/70 max-w-2xl mx-auto">
            Building the definitive construction intelligence platform for Africa&apos;s fastest-growing real estate markets.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {[
              { value: "10,000+", label: "Calculations Done", icon: BarChart3 },
              { value: "50+", label: "Contractor Partners", icon: Users },
              { value: "16", label: "Regions Covered", icon: Globe },
              { value: "98%", label: "Accuracy Rate", icon: Shield },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <s.icon className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal mb-6">The Opportunity</h2>
          <div className="prose prose-gray max-w-none mb-12">
            <p>Ghana&apos;s real estate sector is growing rapidly, driven by urbanisation, a growing middle class, and the global African diaspora investing back home. Yet there is no standardised platform for construction cost estimation.</p>
            <p>BuildCost GH fills this gap — providing accurate, real-time cost data that helps homeowners, developers, and diaspora investors plan their projects with confidence.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {[
              { title: "Large Addressable Market", desc: "10M+ diaspora Africans + 5M+ local homeowners needing construction estimates annually." },
              { title: "Recurring Revenue", desc: "Subscription-based reports with expansion into contractor directory, project management, and financing." },
              { title: "First-Mover Advantage", desc: "No direct competitor offers automated, data-driven cost estimation for the Ghana market." },
              { title: "Scalable Platform", desc: "Built with modern stack (Next.js, Prisma, Paystack) — ready to expand across Africa." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-glass">
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal rounded-2xl p-8 md:p-10 text-center shadow-glass-lg">
            <h2 className="text-2xl font-heading font-bold text-white mb-3">Interested in Investing?</h2>
            <p className="text-emerald-100/70 text-sm max-w-lg mx-auto mb-6">
              We are exploring strategic partnerships and investment opportunities. Contact us for our pitch deck and financials.
            </p>
            <a
              href="mailto:investors@buildcostgh.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-charcoal font-bold hover:bg-gold-light transition-colors"
            >
              Request Pitch Deck <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
