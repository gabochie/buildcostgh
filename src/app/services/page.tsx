import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Calculator, FileText, FileSpreadsheet, Users, HeadphonesIcon, BarChart3 } from "lucide-react"
import { services } from "@/lib/services"

export const metadata: Metadata = {
  title: "Services - Construction Cost Reports & Tools | BuildCost GH",
  description: "Explore our construction cost estimation services including PDF reports, Excel spreadsheets, contractor contacts, and expert consultation.",
}

const iconMap: Record<string, React.ReactNode> = {
  "cost-estimation": <Calculator className="h-8 w-8" />,
  "pdf-reports": <FileText className="h-8 w-8" />,
  "excel-spreadsheets": <FileSpreadsheet className="h-8 w-8" />,
  "contractor-contacts": <Users className="h-8 w-8" />,
  consultation: <HeadphonesIcon className="h-8 w-8" />,
  "project-monitoring": <BarChart3 className="h-8 w-8" />,
}

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Our Services</h1>
          <p className="text-emerald-100/80 text-lg max-w-2xl mx-auto">
            Everything you need to plan, budget, and build your dream home or real estate investment in Ghana with confidence. Built for Ghanaians and the global African diaspora.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-glass-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-gradient-primary group-hover:text-white transition-all">
                {iconMap[service.slug]}
              </div>
              <h2 className="text-xl font-heading font-bold text-charcoal mb-2 group-hover:text-emerald-600 transition-colors">
                {service.title}
              </h2>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.subtitle}</p>
              <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium group-hover:gap-2 transition-all">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
