"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { MapPin, Star, BadgeCheck, Briefcase, Phone, Mail, Globe, ArrowLeft, Shield, Award, ChevronRight, ExternalLink, Clock, Building2 } from "lucide-react"
import { SafeEmail, EmailText } from "@/components/shared/SafeEmail"

interface ContractorRegion {
  region: { name: string; slug: string }
}

interface Contractor {
  id: string
  name: string
  slug: string
  title: string | null
  phone: string
  email: string | null
  website: string | null
  description: string
  specialties: string[]
  yearsOfExperience: number
  verified: boolean
  insurance: string | null
  licenseInfo: string | null
  rating: number
  reviewCount: number
  portfolioImages: string[]
  logo: string | null
  regions: ContractorRegion[]
}

export default function ContractorDetailPage() {
  const params = useParams()
  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!params.slug) return
    fetch(`/api/contractors/${params.slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setContractor)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [params.slug])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  )

  if (error || !contractor) return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center gap-4">
      <Building2 className="h-12 w-12 text-gray-300" />
      <h2 className="text-xl font-bold text-gray-700">Contractor not found</h2>
      <Link href="/contractors" className="text-emerald-600 hover:underline text-sm">Browse all contractors</Link>
    </div>
  )

  const c = contractor

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-12">
        <div className="container mx-auto px-4">
          <Link href="/contractors" className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to contractors
          </Link>
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 ${
              c.verified ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-gray-400 to-gray-500"
            }`}>
              {c.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">{c.name}</h1>
                {c.verified && <BadgeCheck className="h-5 w-5 text-emerald-400" />}
              </div>
              {c.title && <p className="text-emerald-200/70 mt-1">{c.title}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-emerald-200/60 text-sm">
                <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {c.rating.toFixed(1)} ({c.reviewCount} reviews)</span>
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {c.yearsOfExperience} years experience</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pb-16">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass">
              <h2 className="font-bold text-gray-900 mb-3">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{c.description}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass">
              <h2 className="font-bold text-gray-900 mb-3">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {(JSON.parse(JSON.stringify(c.specialties)) as string[]).map((s) => (
                  <span key={s} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-100">
                    {s}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-glass">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Contact</h3>
              <div className="space-y-3">
                <a href={`tel:${c.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                  <Phone className="h-4 w-4 text-gray-400" /> <span>{c.phone}</span>
                </a>
                {c.email && (
                  <SafeEmail email={c.email} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                    <Mail className="h-4 w-4 text-gray-400" /> <EmailText email={c.email} />
                  </SafeEmail>
                )}
                {c.website && (
                  <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                    <Globe className="h-4 w-4 text-gray-400" /> <span className="truncate">{c.website.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink className="h-3 w-3 text-gray-300 ml-auto" />
                  </a>
                )}
              </div>
              <a href={`tel:${c.phone}`} className="block w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold text-center transition-colors">
                <Phone className="h-4 w-4 inline mr-1.5" /> Call Now
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-glass">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Service Areas</h3>
              <div className="flex flex-wrap gap-1.5">
                {c.regions.map((r) => (
                  <Link key={r.region.slug} href={`/contractors?region=${r.region.slug}`} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
                    <MapPin className="h-3 w-3" /> {r.region.name}
                  </Link>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-glass">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Credentials</h3>
              <div className="space-y-2.5 text-sm">
                {c.verified && (
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-gray-700">Verified Contractor</span>
                  </div>
                )}
                {c.insurance && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-700">Insurance: <span className="text-gray-500">{c.insurance}</span></span>
                  </div>
                )}
                {c.licenseInfo && (
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-gray-700">License: <span className="text-gray-500">{c.licenseInfo}</span></span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}