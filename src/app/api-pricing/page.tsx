"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Zap, ChevronRight, Code, Key, BarChart3, Smartphone, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const tiers = [
  {
    id: "dev",
    name: "Dev",
    price: "$0",
    period: "free",
    description: "For testing and prototyping",
    requests: "100 req/month",
    features: ["POST /api/v1/estimate", "All 17 Ghana locations", "3 finish grades", "Email support"],
    cta: "Get Free Key",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For production applications",
    requests: "10,000 req/month",
    features: ["Everything in Dev", "Bulk pricing discounts", "Priority email support", "Usage dashboard", "99.5% uptime SLA"],
    cta: "Subscribe Pro",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For high-volume platforms",
    requests: "Unlimited",
    features: ["Everything in Pro", "Dedicated account manager", "Custom integrations", "White-label reports", "SLA guarantee", "Volume pricing"],
    cta: "Contact Us",
    popular: false,
  },
]

export default function ApiPricingPage() {
  const [email, setEmail] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedKey, setGeneratedKey] = useState("")

  const handleGetKey = async () => {
    if (!email || !email.includes("@")) return
    setGenerating(true)
    try {
      const res = await fetch("/api/public/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedKey(data.key)
        toast.success("API key generated!")
      } else {
        toast.error(data.error || "Failed to generate key")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Key className="h-6 w-6 text-emerald-400" />
            <h1 className="text-3xl md:text-5xl font-heading font-bold text-white">API <span className="text-gradient-gold">Pricing</span></h1>
          </div>
          <p className="text-emerald-100/70 max-w-xl mx-auto">Simple, usage-based pricing for integrating Ghana construction estimates</p>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="max-w-5xl mx-auto mb-20">
          {generatedKey ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl border-2 border-emerald-200 p-8 shadow-glass-lg text-center max-w-lg mx-auto mb-12">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Key className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Your API Key</h3>
              <div className="bg-gray-900 rounded-xl p-3 text-sm font-mono text-green-300 break-all mb-3">{generatedKey}</div>
              <p className="text-xs text-amber-600 font-medium mb-4">Save this key — it will not be shown again</p>
              <button onClick={() => { navigator.clipboard.writeText(generatedKey); toast.success("Copied!") }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">Copy Key</button>
              <Link href="/api-docs" className="block mt-2 text-sm text-emerald-600 hover:underline">View API docs →</Link>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass max-w-lg mx-auto mb-12">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Get a Free Dev Key</h3>
              <div className="flex items-center gap-2">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                  className="flex-1 h-11 rounded-xl border border-gray-200 px-4 text-sm"
                />
                <button
                  onClick={handleGetKey}
                  disabled={generating || !email}
                  className="h-11 px-5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                  Get Key
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl transition-all duration-300 flex flex-col ${
                  tier.popular
                    ? "border-2 border-gold bg-white shadow-glass-lg md:scale-105 z-10"
                    : "border border-gray-200 bg-white shadow-glass hover:shadow-glass-lg"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10">
                    <div className="px-5 py-1.5 bg-gradient-gold text-charcoal text-xs font-bold rounded-b-xl shadow-lg whitespace-nowrap">★ MOST POPULAR</div>
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-center mb-5">
                    <h3 className="font-bold text-lg text-gray-900">{tier.name}</h3>
                    <p className="text-xs text-gray-400 mb-3">{tier.description}</p>
                    <div className="text-4xl font-bold text-emerald-600">{tier.price}<span className="text-sm text-gray-400 font-normal">{tier.period}</span></div>
                    <div className="text-xs text-gray-400 mt-1">{tier.requests}</div>
                  </div>
                  <div className="border-t border-gray-100 pt-4 mb-auto">
                    <ul className="space-y-2.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6">
                    {tier.id === "dev" ? (
                      <button
                        onClick={() => document.getElementById("email-input")?.focus()}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-emerald-400 hover:text-emerald-600 transition-all"
                      >
                        {tier.cta}
                      </button>
                    ) : tier.id === "enterprise" ? (
                      <a href="/contact" className="block w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold text-center hover:bg-emerald-700 transition-all">
                        {tier.cta} <ChevronRight className="h-4 w-4 inline" />
                      </a>
                    ) : (
                      <button className="w-full py-3 rounded-xl bg-gradient-gold text-charcoal text-sm font-bold hover:shadow-lg transition-all">
                        {tier.cta} <ChevronRight className="h-4 w-4 inline" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-2xl border border-gray-200 p-6 shadow-glass">
            <h3 className="font-bold text-gray-900 mb-4 text-center">API Usage by Tier</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-500">Dev</th>
                    <th className="text-center py-3 px-4 font-semibold text-gold-dark">Pro</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-600">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Monthly requests", dev: "100", pro: "10,000", ent: "Unlimited" },
                    { feature: "Locations", dev: "All 17", pro: "All 17", ent: "All 17" },
                    { feature: "Auth method", dev: "Bearer token", pro: "Bearer token", ent: "Bearer token" },
                    { feature: "Support", dev: "Email", pro: "Priority email", ent: "Dedicated manager" },
                    { feature: "SLA", dev: "Best effort", pro: "99.5%", ent: "99.9%" },
                    { feature: "Custom integrations", dev: "—", pro: "—", ent: "Yes" },
                    { feature: "White-label", dev: "—", pro: "—", ent: "Yes" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="py-3 px-4 font-medium text-gray-700">{row.feature}</td>
                      <td className="py-3 px-4 text-center text-sm text-gray-500">{row.dev}</td>
                      <td className="py-3 px-4 text-center text-sm text-gold-dark font-medium bg-gold/5">{row.pro}</td>
                      <td className="py-3 px-4 text-center text-sm text-emerald-600">{row.ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}