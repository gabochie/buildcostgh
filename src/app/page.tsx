"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Play, Shield, Lock, MapPin, ChevronRight } from "lucide-react"
import { AnimatedCounter, GradientButton, GlassCard, TestimonialCard } from "@/components/shared"
import { FaqSection } from "@/components/seo/FaqSection"
import { JsonLd } from "@/components/seo/JsonLd"
import { homepageFaqs } from "@/lib/seo/faqs"
import { useLang } from "@/lib/lang-context"

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
}

const stagger = {
  initial: {},
  whileInView: { transition: { staggerChildren: 0.1 } },
  viewport: { once: true },
}

const testimonials = [
  {
    name: "Kwame Asante",
    role: "Homeowner, Accra",
    content: "BuildCost GH saved me weeks of research. The estimate was within 5% of what my contractor quoted. Worth every pesewa!",
    rating: 5,
  },
  {
    name: "Abena Osei",
    role: "Architect, Kumasi",
    content: "I recommend BuildCost GH to all my clients. The detailed breakdown helps them budget realistically before we even start design.",
    rating: 5,
  },
  {
    name: "Yaw Mensah",
    role: "Real Estate Developer, Tema",
    content: "We use BuildCost GH for all our feasibility studies. The region comparison feature is a game-changer for site selection.",
    rating: 5,
  },
  {
    name: "Ama K.",
    role: "Diaspora Investor, London — Building in Accra",
    content: "Being in the UK, I had no idea what building actually costs in Ghana. BuildCost GH gave me accurate estimates and connected me with vetted contractors. A game-changer for diaspora investors.",
    rating: 5,
  },
]

const steps = [
  { num: "01", title: "Enter Your Details", desc: "Tell us about your project — bedrooms, location, size, and preferences." },
  { num: "02", title: "Get Instant Estimate", desc: "Our engine processes real Ghana market data to give you an accurate cost." },
  { num: "03", title: "Compare Options", desc: "See how costs vary by region, finishing grade, and additional features." },
  { num: "04", title: "Get Your Report", desc: "Download a detailed PDF with itemised costs, timelines, and contractor insights." },
]

export default function HomePage() {
  const { t } = useLang()
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: homepageFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "How to estimate your construction cost in Ghana",
          description:
            "Get an accurate construction cost estimate for your Ghana building project in four simple steps.",
          step: steps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.desc,
          })),
        }}
      />
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-emerald-200 text-sm font-medium mb-6 border border-white/10">
                <Shield className="h-4 w-4 text-emerald-400" />
                {t("home.trustedBy")}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-white leading-tight mb-6">
                {t("home.heroTitle")}
              </h1>
              <p className="text-lg md:text-xl text-emerald-100/80 mb-8 max-w-xl">
                {t("home.heroSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/calculator">
                  <GradientButton variant="gold" size="lg">
                    {t("home.getStarted")} <ArrowRight className="h-5 w-5" />
                  </GradientButton>
                </Link>
                <a
                  href="https://www.youtube.com/watch?v=ezZ3hkpo71g"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-white border border-white/20 hover:bg-white/10 transition-colors font-semibold"
                >
                  <Play className="h-5 w-5" /> Watch Demo
                </a>
              </div>
              <div className="flex items-center gap-6 mt-8 text-sm text-emerald-200/60">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Paystack Secure</span>
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> SSL Encrypted</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Ghana Data</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:block"
            >
              <GlassCard className="p-8">
                <div className="text-sm text-gray-500 mb-2 font-medium">Sample Cost Estimate</div>
                <div className="text-4xl font-bold text-gradient-emerald mb-1">GHS 250,000</div>
                <div className="text-gray-500 text-sm mb-6">3 Bedroom &middot; Accra &middot; 200 m&sup2; &middot; Grade B</div>
                <div className="space-y-3">
                  {[
                    { label: "Foundation", value: "GHS 45,000", pct: 18 },
                    { label: "Structure", value: "GHS 85,000", pct: 34 },
                    { label: "Finishing", value: "GHS 95,000", pct: 38 },
                    { label: "Services", value: "GHS 25,000", pct: 10 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{item.label}</span>
                        <span className="font-medium text-gray-900">{item.value}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-primary rounded-full" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Link href="/calculator" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1">
                    Get your personalized estimate <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section {...fadeUp} className="py-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: 10000, suffix: "+", label: "Calculations" },
              { value: 98, suffix: "%", label: "Accuracy Rate" },
              { value: 50, suffix: "+", label: "Contractor Partners" },
              { value: 24, suffix: "/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-600">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section {...fadeUp} className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal mb-4">
              What Our Users Say
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Join thousands of Ghanaians and diaspora Africans who planned their dream homes and investments with confidence.
            </p>
          </div>
          <motion.div {...stagger} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <TestimonialCard name={t.name} role={t.role} content={t.content} rating={t.rating} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section {...fadeUp} className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal mb-4">
              How It Works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Four simple steps to get your construction cost estimate.
            </p>
          </div>
          <motion.div {...stagger} className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {steps.map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className="text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                  {step.num}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[calc(80%)] h-0.5 bg-gradient-to-r from-emerald-200 to-emerald-100" />
                )}
                <h3 className="font-heading font-bold text-lg text-charcoal mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section {...fadeUp} className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">
            Get Your Free Construction Cost Guide
          </h2>
          <p className="text-emerald-100/80 mb-8 max-w-xl mx-auto">
            Download our comprehensive guide — built for Ghanaians and the global diaspora. Learn how to budget, save money, and avoid common pitfalls.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-emerald-200/50 focus:outline-none focus:border-gold backdrop-blur"
            />
            <GradientButton variant="gold" size="lg">
              Download Free Guide
            </GradientButton>
          </div>
          <p className="text-emerald-200/50 text-xs mt-3">Free PDF &middot; No spam &middot; Unsubscribe anytime</p>
        </div>
      </motion.section>

      <motion.section {...fadeUp} className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-charcoal mb-4">
            Ready to Build?
          </h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">
            Get your construction cost estimate in minutes and start planning your dream home today.
          </p>
          <Link href="/calculator">
            <GradientButton variant="emerald" size="lg">
              Start Your Free Estimate <ArrowRight className="h-5 w-5" />
            </GradientButton>
          </Link>
        </div>
      </motion.section>

      <FaqSection faqs={homepageFaqs} className="bg-gray-50" />
    </>
  )
}
