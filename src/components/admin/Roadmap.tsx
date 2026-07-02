"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2, Circle, Clock, ArrowRight, Hammer, FileText, Image, Smartphone,
  CreditCard, Shield, Search, Mail, BarChart3, Users, Globe, BookOpen,
  Zap, Download, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react"
import Link from "next/link"

type Status = "done" | "wip" | "todo"

type RoadmapItem = {
  label: string
  status: Status
  note?: string
  link?: string
}

type RoadmapPhase = {
  phase: string
  color: string
  icon: typeof Hammer
  items: RoadmapItem[]
}

const roadmap: RoadmapPhase[] = [
  {
    phase: "Phase 1 — Foundation (Complete)",
    color: "emerald",
    icon: Hammer,
    items: [
      { label: "TipTap rich text editor", status: "done", link: "/admin/blog/new" },
      { label: "Image upload API", status: "done" },
      { label: "Blog CRUD (create, edit, publish, draft)", status: "done", link: "/admin" },
      { label: "Category system on blog posts", status: "done" },
      { label: "Blog listing with category filter & pagination", status: "done", link: "/blog" },
      { label: "39 seed blog posts with feature images", status: "done" },
      { label: "Reading time utility", status: "done" },
      { label: "RSS feed", status: "done", link: "/feed.xml" },
      { label: "Sitemap", status: "done", link: "/sitemap.xml" },
      { label: "Related posts & social sharing buttons", status: "done", link: "/blog" },
      { label: "Draft preview for blog posts", status: "done" },
      { label: "Custom 404 page", status: "done" },
      { label: "Calculator with free estimate flow", status: "done", link: "/calculator" },
      { label: "Email capture in calculator", status: "done" },
      { label: "Region comparison tool", status: "done", link: "/calculator" },
      { label: "Paystack integration (Card + Mobile Money)", status: "done" },
      { label: "Order management & success page", status: "done", link: "/admin" },
      { label: "Admin dashboard with stats", status: "done", link: "/admin" },
      { label: "Contact form & message management", status: "done" },
      { label: "Newsletter subscription", status: "done" },
      { label: "Diaspora copy updates across site", status: "done" },
      { label: "Convenience scripts (dev.bat, start.bat)", status: "done" },
      { label: "Legal pages (Privacy, Terms, Cookies, Refund, Disclaimer)", status: "done", link: "/privacy" },
      { label: "Cookie consent banner", status: "done" },
      { label: "WhatsApp button", status: "done" },
      { label: "AI assistant chat widget", status: "done" },
      { label: "Pricing page with Free Trial + paid tiers", status: "done", link: "/pricing" },
      { label: "Trust signals across all pages", status: "done" },
      { label: "Mobile money badges & payment UX", status: "done" },
    ],
  },
  {
    phase: "Phase 2 — Missing Bits (Urgent)",
    color: "amber",
    icon: Zap,
    items: [
      { label: "Order fulfillment — auto-generate PDF report after payment", status: "todo", note: "Critical. Paying users need their PDF/Excel delivered" },
      { label: "Email notifications (order confirmation, report delivery)", status: "todo", note: "Connect to email service (SendGrid/Mailgun)" },
      { label: "Download report from user dashboard", status: "todo", link: "/dashboard" },
      { label: "About page — team bios, company story, credentials", status: "todo", note: "Currently thin, needs founder story & team photos", link: "/about" },
      { label: "Services pages content", status: "todo", note: "Pages exist but need real content", link: "/services" },
      { label: "Google Analytics / conversion tracking", status: "todo" },
      { label: "SEO meta tags for all pages & blog posts", status: "todo" },
      { label: "UploadThing env vars — replace file upload", status: "todo", note: "UPLOADTHING_SECRET and UPLOADTHING_APP_ID are empty", link: "/admin/blog/new" },
    ],
  },
  {
    phase: "Phase 3 — Growth",
    color: "blue",
    icon: BarChart3,
    items: [
      { label: "Auto-generate PDF reports after purchase", status: "todo" },
      { label: "Abandoned lead email nurture sequence", status: "todo", note: "Follow up with users who entered email but didn't complete" },
      { label: "Case studies / project portfolio", status: "todo" },
      { label: "Contractor directory", status: "todo" },
      { label: "Site search (blog + calculator results)", status: "todo" },
      { label: "Social proof widgets (Google Reviews, Trustpilot)", status: "todo" },
      { label: "Performance optimization (images, caching, CDN)", status: "todo" },
      { label: "Multi-language support (Twi, Ga, Ewe)", status: "todo" },
    ],
  },
]

const statusConfig = {
  done: { icon: CheckCircle2, bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", label: "Done" },
  wip: { icon: Clock, bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500", label: "In Progress" },
  todo: { icon: Circle, bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-300", label: "To Do" },
}

export function Roadmap() {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({})

  const toggle = (i: number) => setCollapsed((c) => ({ ...c, [i]: !c[i] }))

  const phaseColors: Record<string, string> = {
    emerald: "from-emerald-500 to-emerald-600",
    amber: "from-amber-500 to-amber-600",
    blue: "from-blue-500 to-blue-600",
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-charcoal">Build Roadmap</h2>
          <p className="text-sm text-gray-500">Track progress and plan next steps for BuildCost GH</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Done</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300" /> To Do</span>
        </div>
      </div>

      {roadmap.map((phase, pi) => {
        const done = phase.items.filter((i) => i.status === "done").length
        const total = phase.items.length
        const pct = Math.round((done / total) * 100)
        const isCollapsed = collapsed[pi]

        return (
          <motion.div
            key={pi}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pi * 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 shadow-glass overflow-hidden"
          >
            <button
              onClick={() => toggle(pi)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${phaseColors[phase.color]} flex items-center justify-center shadow-sm`}>
                  <phase.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{phase.phase}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {done}/{total} tasks completed ({pct}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    pct === 100 ? "bg-emerald-500" : phase.color === "emerald" ? "bg-emerald-500" : phase.color === "amber" ? "bg-amber-500" : "bg-blue-500"
                  }`} style={{ width: `${pct}%` }} />
                </div>
                {isCollapsed ? <ChevronDown className="h-5 w-5 text-gray-400" /> : <ChevronUp className="h-5 w-5 text-gray-400" />}
              </div>
            </button>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="border-t border-gray-100">
                    <div className="divide-y divide-gray-50">
                      {phase.items.map((item, ii) => {
                        const cfg = statusConfig[item.status]
                        const Icon = cfg.icon
                        return (
                          <div key={ii} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50/30 transition-colors group">
                            <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                              item.status === "done" ? "text-emerald-500" : item.status === "wip" ? "text-amber-500" : "text-gray-300"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${
                                  item.status === "done" ? "text-gray-600" : "text-gray-900"
                                }`}>
                                  {item.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
                                  {cfg.label}
                                </span>
                              </div>
                              {item.note && (
                                <p className="text-xs text-gray-400 mt-0.5">{item.note}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.link && (
                                <Link href={item.link} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal rounded-2xl p-6 text-center shadow-glass-lg">
        <h3 className="font-heading font-bold text-white text-lg mb-2">Quick Actions</h3>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/admin/blog/new">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/10">
              <FileText className="h-4 w-4" /> New Blog Post
            </span>
          </Link>
          <Link href="/pricing">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/10">
              <CreditCard className="h-4 w-4" /> Review Pricing
            </span>
          </Link>
          <Link href="/about">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/10">
              <BookOpen className="h-4 w-4" /> Update About Page
            </span>
          </Link>
          <Link href="/dashboard">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors border border-white/10">
              <Users className="h-4 w-4" /> View Dashboard
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
