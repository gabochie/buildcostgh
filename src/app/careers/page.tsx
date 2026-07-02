import type { Metadata } from "next"
import Link from "next/link"
import { Hammer, Mail, MapPin, Clock, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Careers - BuildCost GH",
  description: "Join the BuildCost GH team and help Ghanaians and the African diaspora build their dream homes.",
}

const positions = [
  {
    title: "Full-Stack Developer",
    type: "Remote / Accra",
    dept: "Engineering",
    description: "Build and maintain our cost estimation platform. Experience with Next.js, TypeScript, and Prisma required.",
  },
  {
    title: "Construction Cost Analyst",
    type: "Accra, Ghana",
    dept: "Research",
    description: "Research and verify construction material prices across all 10 regions of Ghana. Maintain our cost database.",
  },
  {
    title: "Marketing Lead",
    type: "Remote",
    dept: "Marketing",
    description: "Drive growth across Ghana and the diaspora community. Manage content, social media, and paid campaigns.",
  },
  {
    title: "Customer Success Manager",
    type: "Remote",
    dept: "Support",
    description: "Help users get the most out of BuildCost GH. Respond to inquiries and improve the user experience.",
  },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <Hammer className="h-7 w-7 text-gold" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Join Our Team</h1>
          <p className="text-lg text-emerald-100/70 max-w-xl mx-auto">
            Help us empower Ghanaians and the global African diaspora to build with confidence.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal mb-3">Why Work With Us</h2>
            <p className="text-gray-500 max-w-xl mx-auto">We are building the definitive construction platform for Africa.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Hammer, title: "Impact", desc: "Help thousands build homes and invest in Ghana" },
              { icon: MapPin, title: "Remote-First", desc: "Work from anywhere in Ghana or abroad" },
              { icon: Clock, title: "Flexible", desc: "Results matter more than hours logged" },
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

          <h2 className="text-2xl md:text-3xl font-heading font-bold text-charcoal mb-8 text-center">Open Positions</h2>
          <div className="space-y-4">
            {positions.length > 0 ? (
              positions.map((pos) => (
                <div key={pos.title} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-glass transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{pos.title}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium">{pos.dept}</span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {pos.type}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">{pos.description}</p>
                    </div>
                    <a
                      href="mailto:careers@buildcostgh.com?subject=Application: {pos.title}"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors whitespace-nowrap"
                    >
                      Apply Now
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 mb-2">No open positions right now</p>
                <p className="text-sm text-gray-400">Send your CV to careers@buildcostgh.com and we will keep you in mind.</p>
              </div>
            )}
          </div>

          <div className="mt-12 p-6 rounded-xl bg-gray-50 border border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Do not see a role that fits? Send your CV to{" "}
              <a href="mailto:careers@buildcostgh.com" className="text-emerald-600 hover:text-emerald-700 font-medium">careers@buildcostgh.com</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
