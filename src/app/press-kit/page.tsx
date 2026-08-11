import type { Metadata } from "next"
import { Hammer, Download, ArrowRight } from "lucide-react"
import { SafeEmail, EmailText } from "@/components/shared/SafeEmail"

export const metadata: Metadata = {
  title: "Press Kit - BuildCost GH",
  description: "Brand assets, logos, and media resources for BuildCost GH.",
}

export default function PressKitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Hammer className="h-7 w-7 text-gold" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Press Kit</h1>
          <p className="text-lg text-emerald-100/70 max-w-xl mx-auto">
            Brand assets, logos, and media resources for journalists, partners, and content creators.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal mb-3">Brand Assets</h2>
            <p className="text-gray-500">Download our logo and brand resources for use in articles, videos, and presentations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {[
              {
                name: "Logo — Horizontal",
                desc: "Full logo with wordmark, ideal for websites and articles",
                color: "bg-white border border-gray-200",
                iconColor: "text-emerald-600",
                bgIcon: "bg-emerald-50",
              },
              {
                name: "Logo — Icon Only",
                desc: "Hammer icon for favicons, avatars, and social media",
                color: "bg-emerald-600",
                iconColor: "text-white",
                bgIcon: "bg-white/20",
              },
              {
                name: "Logo — Dark Background",
                desc: "White logo variant for dark backgrounds",
                color: "bg-charcoal",
                iconColor: "text-white",
                bgIcon: "bg-white/10",
              },
              {
                name: "Brand Guidelines",
                desc: "Color palette, typography, and usage guidelines (PDF)",
                color: "bg-white border border-gray-200",
                iconColor: "text-emerald-600",
                bgIcon: "bg-emerald-50",
              },
            ].map((asset) => (
              <div key={asset.name} className={`rounded-xl overflow-hidden ${asset.color} shadow-glass`}>
                <div className={`p-8 flex items-center justify-center ${asset.color}`}>
                  <div className={`w-16 h-16 rounded-2xl ${asset.bgIcon} flex items-center justify-center`}>
                    <Hammer className={`h-8 w-8 ${asset.iconColor}`} />
                  </div>
                </div>
                <div className="p-4 bg-white border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{asset.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{asset.desc}</p>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-600 transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-heading font-bold text-charcoal mb-3">Media Inquiries</h2>
            <p className="text-sm text-gray-600 max-w-lg mx-auto mb-4">
              For interview requests, guest articles, or partnership inquiries, contact our media team.
            </p>
            <SafeEmail
              email="press@buildcostgh.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
            >
              <EmailText email="press@buildcostgh.com" /> <ArrowRight className="h-4 w-4" />
            </SafeEmail>
          </div>
        </div>
      </section>
    </div>
  )
}
