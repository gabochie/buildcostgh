import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { GradientButton } from "@/components/shared"
import { getService, services } from "@/lib/services"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug)
  if (!service) return {}
  return {
    title: `${service.title} - BuildCost GH`,
    description: service.subtitle,
  }
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params
  const service = getService(slug)

  if (!service) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-primary py-16">
        <div className="container mx-auto px-4">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-emerald-200 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> All Services
          </Link>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-3">{service.title}</h1>
          <p className="text-emerald-100/80 text-lg max-w-2xl">{service.subtitle}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-heading font-bold text-charcoal mb-4">Overview</h2>
              <p className="text-gray-600 leading-relaxed">{service.description}</p>
            </div>

            <div>
              <h2 className="text-2xl font-heading font-bold text-charcoal mb-4">Benefits</h2>
              <ul className="space-y-3">
                {service.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-gray-600">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <p className="text-sm text-amber-800">
                <strong>Included in:</strong> {service.includedIn}
              </p>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 glass rounded-2xl p-6 shadow-glass border border-white/20">
              <h3 className="font-heading font-bold text-lg text-charcoal mb-4">Get Started</h3>
              <p className="text-sm text-gray-600 mb-6">
                Ready to get started with {service.title.toLowerCase()}? Choose the package that fits your needs.
              </p>
              <Link href="/pricing">
                <GradientButton variant="emerald" className="w-full mb-3">
                  {service.ctaText}
                </GradientButton>
              </Link>
              <Link href="/calculator">
                <GradientButton variant="outline" className="w-full">
                  Try Free Calculator First
                </GradientButton>
              </Link>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400 text-center">
                  Have questions? <a href="/contact" className="text-emerald-600 hover:text-emerald-700">Contact us</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
