"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Search, MapPin, Star, BadgeCheck, Briefcase, ChevronRight, SlidersHorizontal, X, AlertTriangle, Database, Layers, ShieldCheck } from "lucide-react"
import { Input } from "@/components/ui/input"

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

interface Contractor {
  id: string
  name: string
  slug: string
  title: string | null
  phone: string
  description: string
  specialties: string[]
  yearsOfExperience: number
  verified: boolean
  rating: number
  reviewCount: number
  logo: string | null
  featured: boolean
  city: string | null
  region: string | null
  companyType: string | null
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
  regions: ContractorRegion[]
  sources: ContractorSource[]
}

const regionSlugs: { name: string; slug: string }[] = [
  "Accra", "Kumasi", "Tema", "Takoradi", "Tamale", "Cape Coast", "Sunyani", "Ho",
  "Koforidua", "Bolgatanga", "Wa", "Goaso", "Techiman", "Dambai", "Sefwi Wiawso",
  "Nalerigu", "Damongo",
].map(n => ({ name: n, slug: n.toLowerCase().replace(/\s+/g, "-") }))

const classificationOptions = [
  { value: "", label: "All Classes" },
  { value: "A", label: "Building (A)" },
  { value: "B", label: "Civil (B)" },
  { value: "L", label: "Electrical (L)" },
  { value: "M", label: "Mechanical (M)" },
  { value: "S", label: "Specialized (S)" },
]

const projectScaleOptions = ["", "Small", "Medium", "Large", "Major", "Enterprise"]

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

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [regionFilter, setRegionFilter] = useState("")
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [classificationFilter, setClassificationFilter] = useState("")
  const [projectScaleFilter, setProjectScaleFilter] = useState("")
  const [sortBy, setSortBy] = useState("default")
  const [showFilters, setShowFilters] = useState(false)

  const hasFilters = Boolean(regionFilter || verifiedOnly || classificationFilter || projectScaleFilter)

  useEffect(() => {
    let ignore = false
    async function fetchContractors() {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (regionFilter) params.set("region", regionFilter)
      if (verifiedOnly) params.set("verified", "true")
      if (classificationFilter) params.set("classification", classificationFilter)
      if (projectScaleFilter) params.set("projectScale", projectScaleFilter)
      if (sortBy !== "default") params.set("sort", sortBy)
      params.set("limit", "50")

      try {
        const res = await fetch(`/api/contractors?${params}`)
        const data = await res.json()
        if (!ignore) {
          setContractors(data.contractors || [])
          setTotal(data.total || 0)
        }
      } catch {
        if (!ignore) setContractors([])
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    const timer = setTimeout(fetchContractors, search ? 300 : 0)
    return () => {
      ignore = true
      clearTimeout(timer)
    }
  }, [regionFilter, verifiedOnly, search, classificationFilter, projectScaleFilter, sortBy])

  const clearFilters = () => {
    setRegionFilter("")
    setVerifiedOnly(false)
    setClassificationFilter("")
    setProjectScaleFilter("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-white mb-4">
            Find a <span className="text-gradient-gold">Contractor</span>
          </h1>
          <p className="text-emerald-100/70 max-w-xl mx-auto">
            Browse registered contractors across Ghana. Every listing shows its source — official ABCEC classification, company website, or Google presence.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 -mt-7 relative z-10 mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-glass-lg p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contractors by name, specialty, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11 text-sm border-gray-200"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-4 h-11 rounded-xl border text-sm font-medium transition-all ${
                  showFilters || hasFilters
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="h-9 rounded-lg border border-gray-200 text-sm px-3 bg-white"
                  >
                    <option value="">All Regions</option>
                    {regionSlugs.map((r) => (
                      <option key={r.slug} value={r.slug}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gray-400" />
                  <select
                    value={classificationFilter}
                    onChange={(e) => setClassificationFilter(e.target.value)}
                    className="h-9 rounded-lg border border-gray-200 text-sm px-3 bg-white"
                  >
                    {classificationOptions.map((o) => (
                      <option key={o.value || "all"} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <select
                    value={projectScaleFilter}
                    onChange={(e) => setProjectScaleFilter(e.target.value)}
                    className="h-9 rounded-lg border border-gray-200 text-sm px-3 bg-white"
                  >
                    {projectScaleOptions.map((s) => (
                      <option key={s || "all"} value={s}>{s || "All Scales"}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                  Verified only
                </label>
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3 w-3" /> Clear filters
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? "Searching..." : `${total} contractor${total !== 1 ? "s" : ""} found`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:inline">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 rounded-lg border border-gray-200 text-xs px-2 bg-white"
              >
                <option value="default">Recommended</option>
                <option value="name">Name A–Z</option>
                <option value="rating">Highest rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-gray-200 rounded w-1/3" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : contractors.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">No contractors found</h3>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {contractors.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link href={`/contractors/${c.slug}`} className="block">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-glass hover:shadow-glass-lg hover:-translate-y-0.5 transition-all">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 ${
                          c.verified ? "bg-gradient-to-br from-emerald-500 to-emerald-700" : "bg-gradient-to-br from-gray-400 to-gray-500"
                        }`}>
                          {c.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-gray-900">{c.name}</h3>
                                {c.verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
                                {c.featured && (
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[10px] font-semibold border border-amber-200">
                                    Featured
                                  </span>
                                )}
                              </div>
                              {c.title && <p className="text-xs text-gray-500">{c.title}</p>}
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                {classChips(c).map((cls) => (
                                  <span key={cls.label} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md text-[10px] font-semibold border border-emerald-100">
                                    {cls.label} {cls.code}
                                  </span>
                                ))}
                                {c.classificationNotVerified && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[10px] font-medium border border-amber-200" title="This classification could not be independently verified">
                                    <AlertTriangle className="h-3 w-3" /> Not independently verified
                                  </span>
                                )}
                                {!c.verified && !c.classificationNotVerified && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 text-gray-500 rounded-md text-[10px] font-medium border border-gray-200">
                                    Unverified
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-sm shrink-0">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="font-semibold text-gray-700">
                                {(c.googleRating ?? c.rating).toFixed(1)}
                              </span>
                              <span className="text-gray-400 text-xs">({c.googleReviewCount ?? c.reviewCount})</span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.description}</p>

                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Briefcase className="h-3.5 w-3.5" /> {c.yearsOfExperience} yrs exp
                            </span>
                            {c.projectScale && (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                                {c.projectScale} scale
                              </span>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {(JSON.parse(JSON.stringify(c.specialties)) as string[]).slice(0, 3).map((s) => (
                                <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-medium">
                                  {s}
                                </span>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 ml-auto text-xs text-gray-400">
                              <span className="flex items-center gap-1" title={`Data confidence ${c.dataConfidence}%`}>
                                <Database className="h-3.5 w-3.5" /> {c.sources.length} source{c.sources.length !== 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {c.city || (c.regions.map(r => r.region.name).slice(0, 2).join(", "))}
                              </span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-300 mt-1 shrink-0" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
