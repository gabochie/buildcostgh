"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  MapPin, Star, BadgeCheck, Briefcase, Phone, Mail, Globe, ArrowLeft, Shield,
  Award, ChevronRight, ExternalLink, Clock, Building2, AlertTriangle, Database,
  Layers, Calendar, FileText, Landmark,
} from "lucide-react"
import { SafeEmail, EmailText } from "@/components/shared/SafeEmail"

interface ContractorRegion {
  region: { name: string; slug: string }
}

interface ContractorSource {
  id: string
  tier: string
  label: string
  url: string | null
  confidence: number
  lastVerifiedAt: string | null
}

interface ContractorProject {
  id: string
  name: string
  type: string | null
  location: string | null
  year: number | null
  value: number | null
  description: string | null
  imageUrl: string | null
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
  companyType: string | null
  legalName: string | null
  yearEstablished: number | null
  registrationStatus: string | null
  contactPerson: string | null
  region: string | null
  district: string | null
  city: string | null
  address: string | null
  googleMapsUrl: string | null
  mwhBuildingClass: string | null
  mwhCivilClass: string | null
  mwhElectricalClass: string | null
  mwhPlumbingClass: string | null
  mrhRoadClass: string | null
  classificationSource: string | null
  classificationExpiry: string | null
  classificationNotVerified: boolean
  projectScale: string | null
  googleRating: number | null
  googleReviewCount: number | null
  verificationLevel: number
  dataConfidence: number
  featured: boolean
  regions: ContractorRegion[]
  sources: ContractorSource[]
  projects: ContractorProject[]
}

function classChips(c: Contractor): { code: string; label: string }[] {
  return [
    { code: c.mwhBuildingClass, label: "Building" },
    { code: c.mwhCivilClass, label: "Civil" },
    { code: c.mwhElectricalClass, label: "Electrical" },
    { code: c.mwhPlumbingClass, label: "Plumbing" },
    { code: c.mrhRoadClass, label: "Road" },
  ].filter((x): x is { code: string; label: string } => Boolean(x.code))
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" })
}

function formatGhs(value: number | null): string | null {
  if (value === null || value === undefined) return null
  return `GHS ${value.toLocaleString("en-GH")}`
}

const sourceTierStyles: Record<string, string> = {
  official: "bg-emerald-50 text-emerald-700 border-emerald-200",
  primary: "bg-blue-50 text-blue-700 border-blue-200",
  secondary: "bg-gray-50 text-gray-600 border-gray-200",
  "user-generated": "bg-amber-50 text-amber-700 border-amber-200",
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
  const classes = classChips(c)
  const locationParts = [c.address, c.city, c.district, c.region].filter(Boolean).join(", ")
  const displayRating = c.googleRating ?? c.rating
  const displayReviews = c.googleReviewCount ?? c.reviewCount
  const hasCredentials = Boolean(c.verified || c.insurance || c.licenseInfo || c.registrationStatus === "registered" || c.verificationLevel > 0)

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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">{c.name}</h1>
                {c.verified && <BadgeCheck className="h-5 w-5 text-emerald-400" />}
                {c.featured && (
                  <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-xs font-semibold border border-amber-300/40">
                    Featured
                  </span>
                )}
              </div>
              {c.title && <p className="text-emerald-200/70 mt-1">{c.title}</p>}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-emerald-200/60 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {displayRating.toFixed(1)} ({displayReviews} reviews)
                </span>
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {c.yearsOfExperience} years experience</span>
                {c.projectScale && (
                  <span className="flex items-center gap-1"><Layers className="h-4 w-4" /> {c.projectScale} scale projects</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {classes.map((cls) => (
                  <span key={cls.label} className="px-2.5 py-1 bg-white/10 text-emerald-100 rounded-lg text-xs font-semibold border border-white/15">
                    {cls.label} Class {cls.code}
                  </span>
                ))}
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
              {(c.legalName || c.companyType || c.registrationStatus) && (
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                  {c.legalName && c.legalName !== c.name && <span>Legal name: <span className="text-gray-700">{c.legalName}</span></span>}
                  {c.companyType && <span>Company type: <span className="text-gray-700">{c.companyType}</span></span>}
                  {c.yearEstablished && <span>Established: <span className="text-gray-700">{c.yearEstablished}</span></span>}
                  {c.registrationStatus && <span>Registry status: <span className="text-gray-700 capitalize">{c.registrationStatus.replace(/-/g, " ")}</span></span>}
                </div>
              )}
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

            {c.classificationNotVerified && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-glass">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Not independently verified.</span>{" "}
                  This listing is based on sources we could not fully confirm. Contact the business directly to verify their current credentials and registration status.
                </p>
              </motion.div>
            )}

            {classes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass">
                <div className="flex items-center gap-2 mb-3">
                  <Landmark className="h-5 w-5 text-emerald-600" />
                  <h2 className="font-bold text-gray-900">Official Classification</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {classes.map((cls) => (
                    <div key={cls.label} className="flex items-center justify-between bg-emerald-50/60 border border-emerald-100 rounded-xl px-4 py-3">
                      <span className="text-sm text-gray-600">{cls.label}</span>
                      <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-sm font-bold">{cls.code}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                  {c.classificationSource && (
                    <p className="flex items-start gap-1.5">
                      <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                      Source: {c.classificationSource}
                    </p>
                  )}
                  {c.classificationExpiry && (
                    <p className="flex items-start gap-1.5">
                      <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                      Certificate valid until: {formatDate(c.classificationExpiry)}
                    </p>
                  )}
                  {c.licenseInfo && (
                    <p className="flex items-start gap-1.5">
                      <Award className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400" />
                      License / registration no: {c.licenseInfo}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {c.projects.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass">
                <h2 className="font-bold text-gray-900 mb-4">Projects</h2>
                <div className="space-y-3">
                  {c.projects.map((p) => (
                    <div key={p.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-800">{p.name}</h3>
                          {p.type && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium">{p.type}</span>}
                        </div>
                        {(p.location || p.year) && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                            {p.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.location}</span>}
                            {p.year && <span>{p.year}</span>}
                          </p>
                        )}
                        {p.description && <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{p.description}</p>}
                      </div>
                      {p.value !== null && p.value !== undefined && (
                        <span className="text-sm font-semibold text-emerald-700 shrink-0">{formatGhs(p.value)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-glass">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Contact</h3>
              <div className="space-y-3">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors">
                    <Phone className="h-4 w-4 text-gray-400" /> <span>{c.phone}</span>
                  </a>
                )}
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
                {locationParts && (
                  <a
                    href={c.googleMapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(locationParts)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span className="flex-1">{locationParts}</span>
                  </a>
                )}
                {!c.phone && !c.email && !c.website && (
                  <p className="text-xs text-gray-400 leading-relaxed">
                    No direct contact details on file yet. Contact information is added only when verified from official or reputable sources.
                  </p>
                )}
              </div>
              {c.phone && (
                <a href={`tel:${c.phone}`} className="block w-full mt-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold text-center transition-colors">
                  <Phone className="h-4 w-4 inline mr-1.5" /> Call Now
                </a>
              )}
            </motion.div>

            {c.regions.length > 0 && (
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
            )}

            {hasCredentials && (
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
                {c.registrationStatus === "registered" && (
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-emerald-600" />
                    <span className="text-gray-700">Registered with ABCEC</span>
                  </div>
                )}
                {c.verificationLevel > 0 && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">Verification level: <span className="text-gray-500">{c.verificationLevel}/5</span></span>
                  </div>
                )}
              </div>
            </motion.div>
            )}

            {c.sources.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-glass">
                <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-gray-400" /> Information Sources
                </h3>
                <div className="space-y-2">
                  {c.sources.map((s) => (
                    <div key={s.id} className="flex items-start gap-2">
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border capitalize shrink-0 mt-0.5 ${sourceTierStyles[s.tier] || sourceTierStyles.secondary}`}>
                        {s.tier}
                      </span>
                      <div className="min-w-0">
                        {s.url ? (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-700 hover:text-emerald-600 transition-colors inline-flex items-center gap-1">
                            {s.label} <ExternalLink className="h-3 w-3 text-gray-300" />
                          </a>
                        ) : (
                          <span className="text-xs text-gray-700">{s.label}</span>
                        )}
                        {s.lastVerifiedAt && (
                          <p className="text-[10px] text-gray-400">Verified {formatDate(s.lastVerifiedAt)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {c.dataConfidence > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <span>Data confidence</span>
                      <span>{c.dataConfidence}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.dataConfidence >= 70 ? "bg-emerald-500" : c.dataConfidence >= 40 ? "bg-amber-400" : "bg-gray-300"}`}
                        style={{ width: `${c.dataConfidence}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
