"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Loader2, Shield, Star, ChevronRight, Smartphone, CreditCard, Zap, FileText, BarChart3, MapPin, Table2, Calendar, Users, PhoneCall, RefreshCw, Mail, MessageSquare, Hammer, Cpu, Repeat } from "lucide-react"
import { toast } from "sonner"
import { GradientButton } from "@/components/shared"
import { getClientGhsRate } from "@/lib/currency"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const featureIcons: Record<string, typeof CheckCircle> = {
  "Instant cost estimate": Zap,
  "Cost breakdown chart": BarChart3,
  "Region comparison tool": MapPin,
  "Email delivery of summary": Mail,
  "Cost summary PDF": FileText,
  "Itemised cost breakdown": FileText,
  "Regional cost notes": MapPin,
  "Diy vs contractor comparison": Users,
  "Editable excel spreadsheet": Table2,
  "Complete material quantities": FileText,
  "12-month construction timeline": Calendar,
  "Regional contractor insights": MapPin,
  "Vetted contractor contacts": Users,
  "Expert project tips pdf": FileText,
  "30-minute consultation call": PhoneCall,
  "1-year cost update service": RefreshCw,
  "Priority email support": MessageSquare,
  "Project monitoring tools": Hammer,
}

const packages = [
  {
    id: "free",
    name: "Free Trial",
    price: 0,
    description: "Try before you buy — no card needed",
    color: "gray",
    features: [
      "Instant cost estimate",
      "Cost breakdown chart",
      "Region comparison tool",
      "Email delivery of summary",
    ],
  },
  {
    id: "basic",
    name: "Basic",
    price: 29,
    description: "Perfect for quick estimates",
    color: "emerald",
    features: [
      "All Free features",
      "Cost summary PDF",
      "Itemised cost breakdown",
      "Regional cost notes",
      "DIY vs contractor comparison",
    ],
  },
  {
    id: "detailed",
    name: "Detailed",
    price: 79,
    description: "Complete project planning",
    popular: true,
    color: "gold",
    features: [
      "All Basic features",
      "Editable Excel spreadsheet",
      "Complete material quantities",
      "12-month construction timeline",
      "Regional contractor insights",
      "Vetted contractor contacts",
    ],
    savings: "Save 37% vs Basic",
  },
  {
    id: "premium",
    name: "Premium",
    price: 199,
    description: "Full project support",
    color: "emerald",
    features: [
      "All Detailed features",
      "Expert project tips PDF",
      "30-minute consultation call",
      "1-year cost update service",
      "Priority email support",
      "Project monitoring tools",
    ],
    savings: "Save 50% vs Basic",
  },
]

const allFeatures = [
  { name: "Instant Cost Estimate", free: true, basic: true, detailed: true, premium: true },
  { name: "Cost Breakdown Chart", free: true, basic: true, detailed: true, premium: true },
  { name: "Region Comparison Tool", free: true, basic: true, detailed: true, premium: true },
  { name: "Email Delivery", free: true, basic: true, detailed: true, premium: true },
  { name: "Cost Summary PDF", free: false, basic: true, detailed: true, premium: true },
  { name: "Itemised Cost Breakdown", free: false, basic: true, detailed: true, premium: true },
  { name: "Regional Cost Notes", free: false, basic: true, detailed: true, premium: true },
  { name: "DIY vs Contractor Comparison", free: false, basic: true, detailed: true, premium: true },
  { name: "Editable Excel Spreadsheet", free: false, basic: false, detailed: true, premium: true },
  { name: "Complete Material Quantities", free: false, basic: false, detailed: true, premium: true },
  { name: "12-Month Construction Timeline", free: false, basic: false, detailed: true, premium: true },
  { name: "Regional Contractor Insights", free: false, basic: false, detailed: true, premium: true },
  { name: "Vetted Contractor Contacts", free: false, basic: false, detailed: false, premium: true },
  { name: "Expert Project Tips PDF", free: false, basic: false, detailed: false, premium: true },
  { name: "30-Minute Consultation Call", free: false, basic: false, detailed: false, premium: true },
  { name: "1-Year Cost Update Service", free: false, basic: false, detailed: false, premium: true },
  { name: "Priority Email Support", free: false, basic: false, detailed: false, premium: true },
  { name: "Project Monitoring Tools", free: false, basic: false, detailed: false, premium: true },
]

const faqs = [
  {
    q: "What exactly is included in the report?",
    a: "Each report includes a comprehensive breakdown of construction costs based on your specific project details. The Basic package includes a PDF summary, while Detailed and Premium include editable Excel files with full material quantities.",
  },
  {
    q: "How quickly will I receive my report?",
    a: "Basic reports are delivered instantly via email. Detailed reports within 2 hours. Premium reports include a consultation call scheduled within 24 hours, with the report delivered within 2 hours of booking.",
  },
  {
    q: "Can I get a refund if I'm not satisfied?",
    a: "Absolutely! We offer a 7-day money-back guarantee. If you're not satisfied with your report, we'll refund your full purchase — no questions asked.",
  },
  {
    q: "Is there a free version?",
    a: "Yes! Our Free Trial gives you an instant cost estimate with a breakdown chart and region comparison — no credit card required. Try the calculator and see how it works before you buy a full report.",
  },
  {
    q: "Can I pay with Mobile Money?",
    a: "Yes! Paystack accepts all major Ghanaian mobile money wallets — MTN MoMo, Vodafone Cash, and AirtelTigo Money. You can also pay with Visa and Mastercard. When you click buy, you will be redirected to Paystack where you can choose your preferred payment method.",
  },
  {
    q: "Do you offer custom quotes for commercial projects?",
    a: "Yes! Contact us directly for commercial construction cost estimation. Our team can handle multi-unit developments, commercial buildings, and industrial projects.",
  },
  {
    q: "How is the cost data updated?",
    a: "We update our cost database monthly using data from suppliers, contractors, and market research across all 16 regions of Ghana.",
  },
  {
    q: "What's the difference between one-time reports and subscriptions?",
    a: "One-time reports are single purchases — you pay once for a detailed report. Subscriptions give you unlimited access: monthly or annual plans with unlimited basic estimates, PDF reports, and tools.",
  },
  {
    q: "Can I switch from monthly to annual?",
    a: "Yes! You can upgrade from Monthly to Annual anytime. The remaining monthly balance is prorated toward your annual plan.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Absolutely. Cancel anytime from your account dashboard. Your access continues until the end of the billing period. No cancellation fees.",
  },
]

const cardVariants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
}

const subscriptionPlans = [
  {
    id: "monthly",
    name: "Monthly Unlimited",
    priceUsd: 19,
    description: "Unlimited basic estimates every month for individual builders",
    popular: false,
    features: [
      "Unlimited basic cost estimates",
      "Cost breakdown charts",
      "Region comparison tool",
      "Email delivery of summaries",
      "Monthly market updates",
    ],
  },
  {
    id: "annual",
    name: "Annual Unlimited",
    priceUsd: 99,
    description: "Best value — unlimited reports all year, save 56% vs monthly",
    popular: true,
    features: [
      "Everything in Monthly Unlimited",
      "Itemised cost breakdown PDFs",
      "Editable Excel spreadsheets",
      "Complete material quantities",
      "12-month construction timeline",
      "Regional contractor insights",
    ],
  },
]

export default function PricingPage() {
  const [currency, setCurrency] = useState<"GHS" | "USD">("GHS")
  const [pricingMode, setPricingMode] = useState<"reports" | "subscriptions">("reports")
  const [rates, setRates] = useState<{ GHS: number }>({ GHS: 15.5 })
  const [rateDate, setRateDate] = useState("")

  useEffect(() => {
    getClientGhsRate()
      .then(({ rate, date }) => {
        if (rate > 0) setRates({ GHS: rate })
        if (date) setRateDate(date)
      })
      .catch(() => {})
  }, [])

  const rate = rates.GHS || 15.5
  const fmtPrice = (usd: number) => {
    if (currency === "USD") return `$${usd.toLocaleString()}`
    const ghs = Math.round(usd * rate)
    return `GHS ${ghs.toLocaleString()}`
  }
  const fmtBtnLabel = (usd: number) => {
    if (currency === "USD") return `$${usd}`
    const ghs = Math.round(usd * rate)
    return `GHS ${ghs.toLocaleString()}`
  }

  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", notes: "" })
  const [loading, setLoading] = useState(false)
  const [formVisible, setFormVisible] = useState<string | null>(null)

  const selectedPackage = packages.find((p) => p.id === (formVisible || selected))

  const handleBuyNow = (pkgId: string) => {
    if (pkgId === "free") {
      window.location.assign("/calculator")
      return
    }
    setSelected(pkgId)
    setFormVisible(pkgId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formVisible || !form.fullName || !form.email) return

    setLoading(true)
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          packageName: selectedPackage!.name,
          amount: Math.round(selectedPackage!.price * rate),
          metadata: { notes: form.notes },
        }),
      })

      const data = await res.json()

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl
      } else {
        toast.error("Failed to initialize payment. Please try again.")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const FeatureIcon = ({ name, className }: { name: string; className?: string }) => {
    const Icon = featureIcons[name.toLowerCase()] || CheckCircle
    return <Icon className={className || "h-4 w-4"} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-20">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="absolute top-10 left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-80 h-80 bg-gold/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-medium border border-white/10">
                <Shield className="h-3.5 w-3.5 text-gold" /> 7-Day Money-Back Guarantee
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-medium border border-white/10">
                <Smartphone className="h-3.5 w-3.5" /> Pay with Card or Mobile Money
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-medium border border-white/10">
                <span className={`${currency === "GHS" ? "text-white font-semibold" : "text-emerald-300/60"}`}>GHS</span>
                <button
                  onClick={() => setCurrency(currency === "GHS" ? "USD" : "GHS")}
                  className="relative w-8 h-4 rounded-full transition-colors bg-white/20"
                >
                  <span className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${currency === "USD" ? "translate-x-4" : ""}`} />
                </button>
                <span className={`${currency === "USD" ? "text-white font-semibold" : "text-emerald-300/60"}`}>USD</span>
                {rateDate && (
                  <span className="hidden sm:inline text-[10px] text-emerald-300/40 ml-1">1 USD = {rate} GHS</span>
                )}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-4">
              Find the Right Plan for Your{" "}
              <span className="text-gradient-gold">Project</span>
            </h1>
            <p className="text-lg md:text-xl text-emerald-100/70 max-w-2xl mx-auto">
              Start with a free estimate, then unlock detailed reports and expert tools as your project grows.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/20 text-center">
          <Zap className="h-4 w-4 text-gold-dark flex-shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-charcoal/80">
            Limited-time pricing — current rates locked for your session.{" "}
            <span className="text-gold-dark font-semibold">Prices may increase with market changes.</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-20">
        {/* Mode toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center bg-white rounded-xl border border-gray-200 shadow-sm p-1">
            <button
              onClick={() => setPricingMode("reports")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                pricingMode === "reports"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="h-4 w-4" />
              One-Time Reports
            </button>
            <button
              onClick={() => setPricingMode("subscriptions")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                pricingMode === "subscriptions"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Repeat className="h-4 w-4" />
              Subscription Plans
            </button>
          </div>
        </div>

        {pricingMode === "subscriptions" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
            {subscriptionPlans.map((plan, i) => {
              const isAnnual = plan.id === "annual"
              return (
                <motion.div
                  key={plan.id}
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className={`relative rounded-2xl transition-all duration-300 flex flex-col ${
                    plan.popular
                      ? "border-2 border-gold bg-white shadow-glass-lg md:scale-105 z-10"
                      : "border border-gray-200 bg-white shadow-glass hover:shadow-glass-lg hover:-translate-y-1"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10">
                      <div className="relative">
                        <div className="px-5 py-1.5 bg-gradient-gold text-charcoal text-xs font-bold rounded-b-xl shadow-lg whitespace-nowrap">
                          ★ BEST VALUE
                        </div>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold-dark rotate-45" />
                      </div>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-center mb-5">
                      <h3 className="font-bold text-lg mb-1 text-charcoal">{plan.name}</h3>
                      <p className="text-xs text-gray-400 mb-4">{plan.description}</p>
                      {isAnnual ? (
                        <div>
                          <div>
                            <span className="text-sm text-gray-400 align-top mr-0.5">{currency === "GHS" ? "GHS" : "$"}</span>
                            <span className="text-5xl font-bold text-gradient-gold">
                              {currency === "GHS" ? Math.round(plan.priceUsd * rate) : plan.priceUsd}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">per year</div>
                          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                            <Zap className="h-3 w-3" /> Save 56% vs monthly
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>
                            <span className="text-sm text-gray-400 align-top mr-0.5">{currency === "GHS" ? "GHS" : "$"}</span>
                            <span className="text-5xl font-bold text-emerald-600">
                              {currency === "GHS" ? Math.round(plan.priceUsd * rate) : plan.priceUsd}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">per month</div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-4 mb-auto">
                      <ul className="space-y-2.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <div className={`rounded-full p-0.5 flex-shrink-0 mt-0.5 ${
                              plan.popular ? "bg-gold/20" : "bg-emerald-50"
                            }`}>
                              <CheckCircle className={`h-3.5 w-3.5 ${
                                plan.popular ? "text-gold-dark" : "text-emerald-600"
                              }`} />
                            </div>
                            <span className="text-sm text-gray-600">{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={() => {
                          toast.info("Subscription payments coming soon — Paystack integration in progress")
                        }}
                        className={`group relative w-full overflow-hidden rounded-xl px-5 py-3 text-sm font-bold text-white transition-all ${
                          plan.popular
                            ? "bg-gradient-gold hover:shadow-lg hover:shadow-gold/25"
                            : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200"
                        }`}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1.5">
                          Subscribe{isAnnual ? " Annual" : " Monthly"}
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Card</span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Mobile Money</span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> Cancel anytime</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto mb-20">
          {packages.map((pkg, i) => {
            const isSelected = (formVisible || selected) === pkg.id
            const isPopular = pkg.popular
            const isFree = pkg.price === 0

            return (
              <motion.div
                key={pkg.id}
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative rounded-2xl transition-all duration-300 flex flex-col ${
                  isPopular
                    ? "border-2 border-gold bg-white shadow-glass-lg md:scale-105 md:-mt-4 md:mb-4 z-10"
                    : isSelected
                      ? "border-2 border-emerald-600 bg-white shadow-glass-lg"
                      : "border border-gray-200 bg-white shadow-glass hover:shadow-glass-lg hover:-translate-y-1"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-10">
                    <div className="relative">
                      <div className="px-5 py-1.5 bg-gradient-gold text-charcoal text-xs font-bold rounded-b-xl shadow-lg whitespace-nowrap">
                        ★ MOST POPULAR
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-gold-dark rotate-45" />
                    </div>
                  </div>
                )}
                {isFree && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full whitespace-nowrap border border-gray-200">
                    NO CARD REQUIRED
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="text-center mb-5">
                    <h3 className={`font-bold text-lg mb-1 ${isPopular ? "text-charcoal" : "text-gray-900"}`}>
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">{pkg.description}</p>
                    <div className="relative">
                      {isFree ? (
                        <div className="text-4xl font-bold text-gray-300">Free</div>
                      ) : (
                        <>
                          <span className="text-sm text-gray-400 align-top mr-0.5">{currency === "GHS" ? "GHS" : "$"}</span>
                          <span className={`text-5xl font-bold ${isPopular ? "text-gradient-gold" : "text-emerald-600"}`}>
                            {currency === "GHS" ? Math.round(pkg.price * rate) : pkg.price}
                          </span>
                        </>
                      )}
                    </div>
                    {pkg.savings && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
                        <Zap className="h-3 w-3" /> {pkg.savings}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-100 pt-4 mb-auto">
                    <ul className="space-y-2.5">
                      {pkg.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <div className={`rounded-full p-0.5 flex-shrink-0 mt-0.5 ${
                            isPopular ? "bg-gold/20" : "bg-emerald-50"
                          }`}>
                            <FeatureIcon
                              name={f}
                              className={`h-3.5 w-3.5 ${
                                isPopular ? "text-gold-dark" : "text-emerald-600"
                              }`}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    {isFree ? (
                      <Link href="/calculator">
                        <div className="group relative w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-semibold hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/50 transition-all">
                          Try Free
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </Link>
                    ) : isPopular ? (
                      <button
                        onClick={() => handleBuyNow(pkg.id)}
                        className="group relative w-full overflow-hidden rounded-xl px-5 py-3 text-sm font-bold text-white transition-all bg-gradient-gold hover:shadow-lg hover:shadow-gold/25"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1.5">
                          {isSelected ? "Selected" : `Get ${pkg.name} — ${fmtBtnLabel(pkg.price)}`}
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyNow(pkg.id)}
                        className="group relative w-full overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-1.5">
                          {isSelected ? "Selected" : `Get ${pkg.name} — ${fmtBtnLabel(pkg.price)}`}
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </button>
                    )}
                  </div>

                  {!isFree && !isSelected && (
                    <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" /> Card</span>
                      <span className="text-gray-300">|</span>
                      <span className="flex items-center gap-1"><Smartphone className="h-3 w-3" /> Mobile Money</span>
                    </div>
                  )}

                  {isSelected && formVisible === pkg.id && pkg.id !== "free" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 pt-4 border-t border-gray-100"
                    >
                      <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={`name-${pkg.id}`} className="text-xs">Full Name *</Label>
                          <Input
                            id={`name-${pkg.id}`}
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            required
                            placeholder="Your name"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`email-${pkg.id}`} className="text-xs">Email *</Label>
                          <Input
                            id={`email-${pkg.id}`}
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            required
                            placeholder="your@email.com"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`phone-${pkg.id}`} className="text-xs">Phone</Label>
                          <Input
                            id={`phone-${pkg.id}`}
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+233 XX XXX XXXX"
                            className="h-9 text-sm"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={loading || !form.fullName || !form.email}
                          className="w-full bg-gradient-primary text-white border-0 hover:opacity-90 h-10 text-sm"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                            </>
                          ) : (
                            <>
                              <Smartphone className="h-4 w-4" />
                              Pay {fmtBtnLabel(pkg.price)} — Card &amp; Mobile Money
                            </>
                          )}
                        </Button>
                      </form>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

        <div className="max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal mb-2">
                Compare Plans Side by Side
              </h2>
              <p className="text-gray-500 text-sm">See exactly what each plan includes</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-glass">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                      <th className="text-left p-4 font-semibold text-gray-900 sticky left-0 bg-gray-50 min-w-[180px]">Feature</th>
                      <th className="p-4 text-center font-semibold text-gray-500 min-w-[80px]">Free</th>
                      <th className="p-4 text-center font-semibold text-gray-900 min-w-[80px]">Basic</th>
                      <th className="p-4 text-center font-semibold text-gold-dark min-w-[80px] bg-gradient-to-b from-gold/5 to-transparent">Detailed</th>
                      <th className="p-4 text-center font-semibold text-emerald-600 min-w-[80px]">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFeatures.map((feat, i) => {
                      const isDelimiter = i === 4 || i === 8 || i === 12
                      return (
                        <tr
                          key={feat.name}
                          className={`transition-colors hover:bg-gray-50/50 ${
                            i % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                          } ${isDelimiter ? "border-t-2 border-gray-100" : "border-t border-gray-100/50"}`}
                        >
                          <td className="p-3.5 text-gray-700 text-sm sticky left-0 bg-inherit">{feat.name}</td>
                          {(["free", "basic", "detailed", "premium"] as const).map((tier) => (
                            <td key={tier} className="p-3.5 text-center">
                              {feat[tier] ? (
                                <div className="flex items-center justify-center">
                                  <div className={`rounded-full p-0.5 ${
                                    tier === "detailed" ? "bg-gold/20" : "bg-emerald-50"
                                  }`}>
                                    <CheckCircle className={`h-4 w-4 ${
                                      tier === "detailed" ? "text-gold-dark" : "text-emerald-600"
                                    }`} />
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-300 text-lg leading-none">&mdash;</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-500 text-sm">Everything you need to know about our plans</p>
            </div>
            <Accordion className="bg-white rounded-2xl border border-gray-200 shadow-glass divide-y divide-gray-100">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-0">
                  <AccordionTrigger className="text-sm font-medium text-gray-900 hover:text-emerald-600 px-6 py-4 hover:no-underline data-[state=open]:text-emerald-600">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 px-6 pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal mb-2">
                Trusted by Homeowners &amp; Developers
              </h2>
              <p className="text-gray-500 text-sm">See why thousands choose BuildCost GH</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { name: "Kojo Addo", role: "Homeowner, Accra", content: "The Detailed report was incredibly thorough. My contractor was impressed with the accuracy.", rating: 5, initials: "KA" },
                { name: "Esi Quansah", role: "Architect, Kumasi", content: "I use BuildCost GH for all my project feasibility studies. Saves me hours of research.", rating: 5, initials: "EQ" },
                { name: "Nana Yaw", role: "Developer, Tema", content: "Premium package paid for itself in the first consultation call. Highly recommend.", rating: 5, initials: "NY" },
              ].map((t) => (
                <div key={t.name} className="glass rounded-2xl p-6 shadow-glass hover:shadow-glass-lg transition-all">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-500">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mb-16"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal p-8 md:p-10 text-center shadow-glass-lg">
            <div className="absolute inset-0 bg-grid opacity-10" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/10">
                <Shield className="h-8 w-8 text-gold" />
              </div>
              <h3 className="text-2xl md:text-3xl font-heading font-bold text-white mb-3">100% Risk-Free</h3>
              <p className="text-emerald-100/70 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
                If you are not satisfied with your report for any reason within 7 days, we will refund your full purchase. No questions asked, no hassle.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-emerald-200/50">
                <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Visa &amp; Mastercard</span>
                <span className="flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> MTN, Vodafone &amp; AirtelTigo MoMo</span>
                <span className="flex items-center gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> 7-Day Refund</span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="text-center pb-16">
          <p className="text-gray-400 text-sm">
            Still have questions?{" "}
            <a href="/contact" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">Contact us</a>{" "}
            or call{" "}
            <a href="tel:+233539364716" className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors">+233 53 936 4716</a>
          </p>
        </div>
      </div>
    </div>
  )
}
