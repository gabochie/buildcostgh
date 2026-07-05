import type { Metadata } from "next"
import Link from "next/link"
import { Calculator, CreditCard, FileText, ArrowRight, Search, Users, BarChart3 } from "lucide-react"

export const metadata: Metadata = {
  title: "How It Works - BuildCost GH",
  description: "Get an accurate construction cost estimate in 3 simple steps. Free trial available — no credit card needed. Start planning your Ghana build today.",
}

const steps = [
  {
    step: 1,
    icon: Calculator,
    title: "Enter Your Project Details",
    desc: "Tell us about your project — bedrooms, location, floor area, and finishing grade. Our calculator covers all 16 regions of Ghana with up-to-date material and labour costs.",
  },
  {
    step: 2,
    icon: BarChart3,
    title: "Get Your Instant Estimate",
    desc: "Receive a detailed cost breakdown instantly. Compare material, labour, and contingency costs. Toggle between USD and GHS pricing with real-time exchange rates.",
  },
  {
    step: 3,
    icon: FileText,
    title: "Choose Your Report",
    desc: "Pick from Free Trial (instant summary), Basic ($29 PDF), Detailed ($79 with Excel), or Premium ($199 with consultation). Pay with card or mobile money via Paystack.",
  },
  {
    step: 4,
    icon: Users,
    title: "Connect with Contractors",
    desc: "Detailed and Premium reports include verified contractor contacts and regional insights. Browse our contractor marketplace to find the right builder for your project.",
  },
]

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">
            How It <span className="text-gradient-gold">Works</span>
          </h1>
          <p className="text-emerald-100/70 max-w-xl mx-auto">
            From idea to estimate in minutes — no construction experience needed
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-7 relative z-10 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-8">
            {steps.map((s, i) => (
              <div key={s.step} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass flex items-start gap-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-8 text-center">
            <h2 className="text-2xl font-heading font-bold text-charcoal mb-3">Ready to Start?</h2>
            <p className="text-gray-600 mb-6">Get your free instant estimate in under 2 minutes.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/calculator" className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-center">
                Try the Calculator Free
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto px-6 py-3 border border-emerald-200 text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors text-center">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}