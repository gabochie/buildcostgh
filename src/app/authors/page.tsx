import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Authors - BuildCost GH",
  description: "Meet the team behind BuildCost GH. Construction cost experts helping Ghanaians and the diaspora plan their builds.",
}

const authors = [
  {
    name: "BuildCost GH Team",
    role: "Construction Cost Analysts & Content Team",
    bio: "The BuildCost GH team is a group of construction professionals, quantity surveyors, and content specialists dedicated to helping Ghanaians and the African diaspora plan their construction projects with accurate, up-to-date cost data. We research material prices across all 16 regions of Ghana, interview contractors and suppliers, and compile data-driven guides to help you build smarter.",
    expertise: ["Construction Cost Estimation", "Ghana Building Regulations", "Material Price Analysis", "Diaspora Building Guides"],
    social: {
      twitter: "https://x.com/buildcostgh",
      email: "hello@buildcostgh.com",
    },
  },
]

function AuthorCard({ author: a }: { author: typeof authors[number] }) {
  const initials = a.name.split(" ").map(n => n[0]).join("").slice(0, 2)
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-glass">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 h-32" />
      <div className="px-6 pb-6 -mt-12">
        <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-white mb-4">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold text-charcoal mb-1">{a.name}</h2>
          <p className="text-sm text-emerald-600 font-medium mb-3">{a.role}</p>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{a.bio}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {a.expertise.map(e => (
              <span key={e} className="bg-emerald-50 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {e}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4 text-sm">
            {a.social.twitter && (
              <a href={a.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-emerald-600">
                Twitter/X
              </a>
            )}
            {a.social.email && (
              <a href={`mailto:${a.social.email}`} className="text-gray-500 hover:text-emerald-600">
                {a.social.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthorsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">
            Our <span className="text-gradient-gold">Authors</span>
          </h1>
          <p className="text-emerald-100/70 max-w-xl mx-auto">
            The people behind BuildCost GH&apos;s research and content
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-7 relative z-10 pb-16">
        <div className="max-w-2xl mx-auto space-y-6">
          {authors.map(a => <AuthorCard key={a.name} author={a} />)}
        </div>

        <div className="max-w-2xl mx-auto mt-10 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-8 text-center">
          <h2 className="text-2xl font-heading font-bold text-charcoal mb-3">Want to Contribute?</h2>
          <p className="text-gray-600 mb-4">We are always looking for construction professionals and building experts to contribute to our content.</p>
          <a href="mailto:hello@buildcostgh.com" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  )
}