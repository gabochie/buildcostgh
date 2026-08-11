import type { Metadata } from "next"
import Link from "next/link"
import { Hammer, Users, DollarSign, Percent, ExternalLink, ArrowRight, CheckCircle } from "lucide-react"
import { SafeEmail, EmailText } from "@/components/shared/SafeEmail"

export const metadata: Metadata = {
  title: "Affiliates - BuildCost GH",
  description: "Earn commissions by referring customers to BuildCost GH. Join our affiliate program and monetise your audience.",
}

export default function AffiliatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Users className="h-7 w-7 text-gold" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Affiliate Program</h1>
          <p className="text-lg text-emerald-100/70 max-w-xl mx-auto">
            Earn commissions by referring homeowners, developers, and diaspora investors to BuildCost GH.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: DollarSign, title: "20% Commission", desc: "Earn 20% on every sale you refer — Basic, Detailed, and Premium packages." },
              { icon: Percent, title: "Recurring Pays", desc: "Earn on repeat purchases from customers you referred within 12 months." },
              { icon: ExternalLink, title: "Unique Links", desc: "Get a personalised referral link and dashboard to track your earnings." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-glass hover:shadow-glass-lg transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal mb-6">How It Works</h2>
          <div className="space-y-4 mb-12">
            {[
              { num: "01", title: "Sign Up", desc: "Fill in the form below to join the affiliate program." },
              { num: "02", title: "Share Your Link", desc: "Share your unique referral link on social media, blogs, YouTube, or WhatsApp." },
              { num: "03", title: "Earn Commissions", desc: "Get 20% commission on every sale. Paid monthly via Mobile Money or bank transfer." },
            ].map((step) => (
              <div key={step.num} className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 p-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal rounded-2xl p-8 text-center shadow-glass-lg mb-12">
            <h2 className="text-2xl font-heading font-bold text-white mb-3">Ready to Start Earning?</h2>
            <p className="text-emerald-100/70 text-sm max-w-lg mx-auto mb-6">
              Join our affiliate program and earn 20% commission on every referral. No minimum payout. Paid monthly.
            </p>
            <SafeEmail
              email="affiliates@buildcostgh.com"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-charcoal font-bold hover:bg-gold-light transition-colors"
            >
              Join Affiliate Program <ArrowRight className="h-4 w-4" />
            </SafeEmail>
            <p className="text-emerald-200/50 text-xs mt-3">Or email <EmailText email="affiliates@buildcostgh.com" /> to learn more</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                { q: "Who can join?", a: "Anyone with an audience interested in construction or real estate in Ghana — bloggers, YouTubers, real estate agents, diaspora community leaders, and social media influencers." },
                { q: "How and when do I get paid?", a: "Commissions are paid monthly via Mobile Money (MTN, Vodafone, AirtelTigo), bank transfer, or PayPal. Minimum payout is GHS 100." },
                { q: "How are referrals tracked?", a: "You get a unique referral link. When someone clicks your link and makes a purchase within 30 days, the sale is attributed to you." },
              ].map((faq) => (
                <div key={faq.q}>
                  <h4 className="font-medium text-gray-900 text-sm">{faq.q}</h4>
                  <p className="text-sm text-gray-600 mt-1">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
