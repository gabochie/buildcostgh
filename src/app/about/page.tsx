import { Hammer, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const values = [
  { title: "Real Market Data", desc: "Prices updated regularly from across Ghana" },
  { title: "Mobile Friendly", desc: "Use on any device, anywhere in Ghana" },
  { title: "Secure Payments", desc: "MTN Mobile Money integration for safe transactions" },
  { title: "Expert Support", desc: "Get help from construction experts" },
]

export default function AboutPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Hammer className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">About BuildCost GH</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              We&apos;re the leading construction cost estimation platform for Ghanaians and the global African diaspora,
              helping thousands plan their dream homes and real estate investments with accurate, real-time cost data.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              At BuildCost GH, we believe that every Ghanaian and every member of the global African diaspora
              deserves to build or invest in Ghana with confidence. Our platform provides accurate construction
              cost estimates based on real market data, helping you plan your budget effectively and avoid costly surprises.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Choose Us</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {values.map((v) => (
                <div key={v.title} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">{v.title}</h3>
                    <p className="text-sm text-gray-500">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-8">
              <Link href="/calculator">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  Start Calculating
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
