"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Roadmap } from "@/components/admin/Roadmap"
import { CofounderTab } from "@/components/admin/CofounderTab"
import { formatCurrency } from "@/lib/utils"
import { getClientGhsRate } from "@/lib/currency"
import { toast } from "sonner"
import {
  Loader2, TrendingUp, ShoppingBag, MessageSquare, Users, Mail,
  FileText, ExternalLink, Eye, Shield, CheckCircle, Clock,
  AlertCircle, ArrowRight, Plus, Search, Download, Presentation, Printer, Crosshair, Zap, Target, Globe, Award, Lightbulb, Cpu, Activity, CheckSquare, Sliders, RefreshCw, Pause, Play, Trash2, Building2, Star, BadgeCheck, Briefcase, MapPin, Edit, ChevronDown, Megaphone, Sparkles, Send, X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PasswordField } from "@/components/shared/PasswordField"
import { fmtGhs } from "@/lib/rates"
import { BuildingTypesAdminTab } from "@/components/admin/BuildingTypesAdminTab"
import { PermitsAdminTab } from "@/components/admin/PermitsAdminTab"

type Stats = {
  totalOrders: number; completedOrders: number; pendingOrders: number
  totalRevenue: number; totalMessages: number; unreadMessages: number
  totalLeads: number; totalSubscribers: number
}

type Order = {
  id: string; fullName: string; email: string; package: string
  amount: number; status: string; reference: string; reportUrl: string | null; createdAt: string
  phone: string | null; metadata: Record<string, unknown> | null
}

type ContactMessage = {
  id: string; name: string; email: string; subject: string
  message: string; read: boolean; createdAt: string
}

type BlogPostItem = {
  id: string; title: string; slug: string; published: boolean
  author: string; category: string; createdAt: string
}

type CalculatorLead = {
  id: string; email: string; bedrooms: string | null
  location: string | null; completed: boolean; createdAt: string
}

type NewsletterSubscriber = {
  id: string; email: string; name: string | null; subscribed: boolean; createdAt: string
}

type EcosystemStage = {
  phase: string; emoji: string; color: string; pain: string
  products: string[]; revenue: string; link: string
}

type AdminContractorSource = {
  id?: string; tier?: string; label: string; url?: string | null; confidence?: number; lastVerifiedAt?: string | null
}

type AdminContractorProject = {
  id?: string; name: string; type?: string | null; location?: string | null; year?: number | null
  value?: number | null; description?: string | null; imageUrl?: string | null; sort?: number
}

type AdminContractor = {
  id: string; name: string; title: string | null; phone: string; email: string | null
  website: string | null; description: string; specialties: string[]
  yearsOfExperience: number; verified: boolean; rating: number
  licenseInfo: string | null; insurance: string | null; projectScale: string | null
  companyType: string | null; legalName: string | null; yearEstablished: number | null
  registrationStatus: string | null; city: string | null; region: string | null; district: string | null
  mwhBuildingClass: string | null; mwhCivilClass: string | null; mwhElectricalClass: string | null
  mwhPlumbingClass: string | null; mrhRoadClass: string | null; classificationSource: string | null
  classificationExpiry: string | null; classificationNotVerified: boolean
  verificationLevel: number; dataConfidence: number; featured: boolean
  sources: AdminContractorSource[]; projects: AdminContractorProject[]
}

type AgentLogItem = {
  id: string; agent: string; action: string; entityType: string | null; entityId: string | null
  level: string; createdAt: string
}

type AgentStat = {
  name: string; status: string; totalActions: number; errors: number
  lastAction: string | null; lastSeen: string | null; minutesSinceLastSeen: number | null
}

type AdminApiKey = {
  id: string; label: string; keyHash: string; tier: string; usageCount: number
  monthlyLimit: number; active: boolean; createdAt: string; lastUsedAt: string | null
}

type AdminSeasonalFactor = {
  id: string; region: string | null; month: number; material: string | null
  multiplier: number; reason: string | null; active: boolean; monthLabel: string | number
}

const statusStyles: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
}

const statusIcons: Record<string, LucideIcon> = {
  completed: CheckCircle,
  pending: Clock,
  failed: AlertCircle,
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "overview"
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [blogPosts, setBlogPosts] = useState<BlogPostItem[]>([])
  const [leads, setLeads] = useState<CalculatorLead[]>([])
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    let ignore = false

    async function loadData() {
      try {
        const [s, o, m, b, l, n, mt] = await Promise.all([
          fetch("/api/admin/stats").then(r => r.json()),
          fetch("/api/orders").then(r => r.json()),
          fetch("/api/contact").then(r => r.json()),
          fetch("/api/blog").then(r => r.json()),
          fetch("/api/calculator/save-lead").then(r => r.json()).catch(() => []),
          fetch("/api/newsletter").then(r => r.json()).catch(() => []),
          fetch("/api/admin/maintenance").then(r => r.json()).catch(() => ({ enabled: false })),
        ])
        if (ignore) return
        setStats(s); setOrders(o); setMessages(m)
        setBlogPosts(b); setLeads(l); setSubscribers(n)
        setMaintenanceMode(mt.enabled)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000)
    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [session])

  const refreshOrders = async () => {
    const o = await fetch("/api/orders").then(r => r.json()).catch(() => null)
    if (o) setOrders(o)
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!session) {
    return <AdminLogin />
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {tab === "overview" ? "Dashboard" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back, {session.user?.name || session.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {tab === "blog" && (
            <Link href="/admin/blog/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
                <Plus className="h-4 w-4 mr-1.5" /> New Post
              </Button>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : tab === "overview" ? (
        <OverviewTab
          stats={stats} orders={orders} messages={messages}
          maintenanceMode={maintenanceMode} toggling={toggling}
          toggleMaintenance={async () => {
            setToggling(true)
            try {
              const res = await fetch("/api/admin/maintenance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ enabled: !maintenanceMode }),
              })
              const data = await res.json()
              setMaintenanceMode(data.enabled)
            } catch (e) { console.error(e) }
            finally { setToggling(false) }
          }}
        />
      ) : tab === "orders" ? (
        <OrdersTab orders={orders} onRefresh={refreshOrders} />
      ) : tab === "messages" ? (
        <MessagesTab messages={messages} />
      ) : tab === "leads" ? (
        <LeadsTab leads={leads} />
      ) : tab === "newsletter" ? (
        <NewsletterTab subscribers={subscribers} />
      ) : tab === "roadmap" ? (
        <Roadmap />
) : tab === "blog" ? (
    <BlogTab posts={blogPosts} />
  ) : tab === "settings" ? (
    <SettingsTab session={session} />
  ) : tab === "strategy" ? (
    <StrategyTab />
  ) : tab === "ecosystem" ? (
    <EcosystemTab />
  ) : tab === "prelaunch" ? (
    <PrelaunchChecklist />
  ) : tab === "pitchdeck" ? (
    <PitchDeckView />
  ) : tab === "competitiveanalysis" ? (
    <CompetitiveAnalysisView />
  ) : tab === "contractors" ? (
    <ContractorManager />
  ) : tab === "rates" ? (
    <RegionRatesTab />
  ) : tab === "content" ? (
    <ContentMarketingTab />
  ) : tab === "commandcenter" ? (
    <CommandCenter />
  ) : tab === "cofounder" ? (
    <CofounderTab />
  ) : tab === "buildingtypes" ? (
    <BuildingTypesAdminTab />
  ) : tab === "permits" ? (
    <PermitsAdminTab />
  ) : null}
    </div>
  )
}

/* ── Overview ── */
function OverviewTab({ stats, orders, messages, maintenanceMode, toggling, toggleMaintenance }: {
  stats: Stats | null; orders: Order[]; messages: ContactMessage[];
  maintenanceMode: boolean; toggling: boolean; toggleMaintenance: () => void
}) {
  const cards = [
    { label: "Total Revenue", value: formatCurrency(stats?.totalRevenue || 0), icon: TrendingUp, bg: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
    { label: "Orders", value: String(stats?.totalOrders || 0), sub: `${stats?.completedOrders || 0} completed`, icon: ShoppingBag, bg: "bg-gradient-to-br from-blue-500 to-blue-600" },
    { label: "Messages", value: String(stats?.totalMessages || 0), sub: `${stats?.unreadMessages || 0} unread`, icon: MessageSquare, bg: "bg-gradient-to-br from-violet-500 to-violet-600" },
    { label: "Leads", value: String(stats?.totalLeads || 0), sub: `${stats?.totalSubscribers || 0} subscribers`, icon: Users, bg: "bg-gradient-to-br from-amber-500 to-amber-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`relative overflow-hidden rounded-2xl ${card.bg} p-5 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white/80">{card.label}</p>
                <card.icon className="h-5 w-5 text-white/60" />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              {card.sub && <p className="text-xs text-white/70 mt-1">{card.sub}</p>}
            </div>
            <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
          </div>
        ))}
      </div>

      {/* Maintenance Toggle */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Maintenance Mode</h3>
            <p className="text-sm text-slate-500">
              {maintenanceMode ? "Site is offline — visitors see the maintenance page" : "Site is live and accessible"}
            </p>
          </div>
        </div>
        <button
          onClick={toggleMaintenance}
          disabled={toggling}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
            maintenanceMode ? "bg-amber-500" : "bg-slate-300"
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            maintenanceMode ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersCard orders={orders} />
        <RecentMessagesCard messages={messages} />
      </div>
    </div>
  )
}

function RecentOrdersCard({ orders }: { orders: Order[] }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-emerald-600" /> Recent Orders
        </h3>
        {orders.length > 0 && (
          <button onClick={() => {}} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No orders yet</p>
      ) : (
        <div className="space-y-1">
          {orders.slice(0, 5).map((o) => {
            const StatusIcon = statusIcons[o.status] || AlertCircle
            return (
              <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    o.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                    o.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                  }`}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{o.fullName}</p>
                    <p className="text-xs text-slate-400">{o.package}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-sm font-semibold text-slate-900">GHS {o.amount}</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${
                    statusStyles[o.status] || "bg-slate-50 text-slate-600 border-slate-200"
                  }`}>{o.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RecentMessagesCard({ messages }: { messages: ContactMessage[] }) {
  const unread = messages.filter(m => !m.read)
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600" /> Unread Messages
        </h3>
        {unread.length > 0 && (
          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{unread.length}</span>
        )}
      </div>
      {unread.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">All caught up!</p>
      ) : (
        <div className="space-y-1">
          {unread.slice(0, 5).map((m) => (
            <div key={m.id} className="py-2.5 border-b border-slate-100 last:border-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">{m.name}</p>
                <span className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Orders ── */
function OrdersTab({ orders, onRefresh }: { orders: Order[]; onRefresh: () => void }) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const isManual = (o: Order) => String(o.metadata?.paymentMethod) === "manual_momo"

  const handleConfirm = async (order: Order) => {
    setConfirmingId(order.id)
    try {
      const res = await fetch("/api/admin/orders/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success(`Payment confirmed for ${order.fullName}`)
        onRefresh()
      } else {
        toast.error(data.error || "Failed to confirm payment")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No orders yet</p>
        </div>
      ) : (
        orders.map((order) => {
          const StatusIcon = statusIcons[order.status] || AlertCircle
          const manual = isManual(order)
          return (
            <div key={order.id} className="rounded-2xl border bg-white p-5 flex items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  order.status === "completed" ? "bg-emerald-50 text-emerald-600" :
                  order.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                }`}>
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{order.fullName}</p>
                  <p className="text-sm text-slate-500">{order.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{order.package} &middot; Ref: {order.reference}</p>
                  {manual && (
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      Manual MoMo &middot; Tx Ref: {String(order.metadata?.transactionRef ?? "-")} &middot; Payer: {String(order.metadata?.payerPhone ?? "-")} &middot; To: {String(order.metadata?.momoNumber ?? "-")}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-semibold text-slate-900">GHS {order.amount}</p>
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full border mt-1 ${
                  statusStyles[order.status] || ""
                }`}>{order.status}</span>
                {manual && (
                  <span className="inline-block text-xs px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 mt-1 ml-1">
                    Manual MoMo
                  </span>
                )}
                {manual && order.status === "pending" && (
                  <button
                    onClick={() => handleConfirm(order)}
                    disabled={confirmingId === order.id}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors"
                  >
                    {confirmingId === order.id ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3.5 w-3.5" /> Confirm Payment
                      </>
                    )}
                  </button>
                )}
                {order.reportUrl && (
                  <a href={order.reportUrl} target="_blank" className="block text-xs text-emerald-600 hover:underline mt-1.5 font-medium">
                    View Report &rarr;
                  </a>
                )}
                {String(order.metadata?.spreadsheetUrl ?? "") && (
                  <a href={String(order.metadata?.spreadsheetUrl)} target="_blank" className="block text-xs text-teal-600 hover:underline mt-1 font-medium">
                    View Excel &rarr;
                  </a>
                )}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

/* ── Messages ── */
function MessagesTab({ messages }: { messages: ContactMessage[] }) {
  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No messages yet</p>
        </div>
      ) : (
        messages.map((msg) => (
          <div key={msg.id} className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${
            !msg.read ? "border-emerald-200 bg-emerald-50/30" : "bg-white"
          }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="font-medium text-slate-900">{msg.name}</p>
                {!msg.read && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
              </div>
              <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-slate-500">{msg.email}</p>
            {msg.subject && <p className="text-sm font-medium text-slate-700 mt-1">{msg.subject}</p>}
            <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-xl p-3">{msg.message}</p>
          </div>
        ))
      )}
    </div>
  )
}

/* ── Leads ── */
function LeadsTab({ leads }: { leads: CalculatorLead[] }) {
  const completed = leads.filter(l => l.completed).length
  const abandoned = leads.filter(l => !l.completed).length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Leads", value: leads.length, bg: "bg-gradient-to-br from-blue-500 to-blue-600" },
          { label: "Completed", value: completed, bg: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
          { label: "Abandoned", value: abandoned, bg: "bg-gradient-to-br from-amber-500 to-amber-600" },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl ${item.bg} p-5 text-white shadow-lg`}>
            <p className="text-sm text-white/80">{item.label}</p>
            <p className="text-3xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      {leads.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No leads captured yet</p>
        </div>
      ) : (
        leads.map((lead) => (
          <div key={lead.id} className="rounded-2xl border bg-white p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="font-medium text-slate-900">{lead.email}</p>
              <p className="text-sm text-slate-500">{lead.location || "No location"} &middot; {lead.bedrooms || "?"} bedrooms</p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>{new Date(lead.createdAt).toLocaleDateString()}</p>
              <span className={`inline-block mt-1 text-xs px-2.5 py-1 rounded-full border font-medium ${
                lead.completed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>{lead.completed ? "Completed" : "Abandoned"}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

/* ── Newsletter ── */
function NewsletterTab({ subscribers }: { subscribers: NewsletterSubscriber[] }) {
  const active = subscribers.filter(s => s.subscribed).length
  const unsubscribed = subscribers.filter(s => !s.subscribed).length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Subscribers", value: subscribers.length, bg: "bg-gradient-to-br from-blue-500 to-blue-600" },
          { label: "Active", value: active, bg: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
          { label: "Unsubscribed", value: unsubscribed, bg: "bg-gradient-to-br from-slate-500 to-slate-600" },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl ${item.bg} p-5 text-white shadow-lg`}>
            <p className="text-sm text-white/80">{item.label}</p>
            <p className="text-3xl font-bold mt-1">{item.value}</p>
          </div>
        ))}
      </div>
      {subscribers.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No subscribers yet</p>
        </div>
      ) : (
        subscribers.map((sub) => (
          <div key={sub.id} className="rounded-2xl border bg-white p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="font-medium text-slate-900">{sub.email}</p>
              <p className="text-sm text-slate-500">
                {sub.name && `${sub.name} \u00b7 `}Subscribed {new Date(sub.createdAt).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              sub.subscribed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
            }`}>{sub.subscribed ? "Active" : "Unsubscribed"}</span>
          </div>
        ))
      )}
    </div>
  )
}

/* ── Blog ── */
function BlogTab({ posts }: { posts: BlogPostItem[] }) {
  return (
    <div className="space-y-3">
      {posts.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No blog posts yet</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="rounded-2xl border bg-white p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900 truncate">{post.title}</p>
              <p className="text-sm text-slate-500 truncate">
                /blog/{post.slug} &middot; by {post.author} &middot; {post.category?.replace(/-/g, " ")}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                post.published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500 border-slate-200"
              }`}>{post.published ? "Published" : "Draft"}</span>
              <Link href={`/admin/blog/${post.id}`}>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={post.published ? `/blog/${post.slug}` : `/blog/preview/${post.slug}`} target="_blank">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-700">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

/* ── Settings ── */
function SettingsTab({ session }: { session: { user?: { name?: string | null; email?: string | null; id?: string } } }) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Admin Profile</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Name</span>
            <span className="text-slate-900 font-medium">{session?.user?.name || "Admin"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Email</span>
            <span className="text-slate-900 font-medium">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">User ID</span>
            <span className="text-slate-900 font-medium text-xs font-mono">{session?.user?.id}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Site Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Site URL</span>
            <span className="text-slate-900 font-medium">https://buildcostgh.com</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Deployment</span>
            <span className="text-slate-900 font-medium">Vercel (Production)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Database</span>
            <span className="text-slate-900 font-medium">PostgreSQL (Neon)</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-amber-50/50 p-6">
        <h3 className="font-semibold text-slate-900 mb-2">Environment Variables</h3>
        <p className="text-sm text-slate-500 mb-4">
          Production API keys for Paystack, Coinbase Commerce, Resend, UploadThing, and Google Auth are not configured.
        </p>
        <div className="text-xs text-slate-400 space-y-1 font-mono">
          <p>PAYSTACK_SECRET_KEY <span className="text-amber-500 ml-2">not set</span></p>
          <p>COINBASE_COMMERCE_API_KEY <span className="text-amber-500 ml-2">not set</span></p>
          <p>COINBASE_COMMERCE_WEBHOOK_SECRET <span className="text-amber-500 ml-2">not set</span></p>
          <p>RESEND_API_KEY <span className="text-amber-500 ml-2">not set</span></p>
          <p>UPLOADTHING_SECRET <span className="text-amber-500 ml-2">not set</span></p>
        </div>
      </div>
    </div>
  )
}

/* ── Strategy ── */
function StrategyTab() {
  const [subTab, setSubTab] = useState("gtm")
  const subTabs = [
    { id: "gtm", label: "GTM Strategy" },
    { id: "revenue", label: "Revenue & Monetization" },
    { id: "diaspora", label: "Diaspora Market" },
    { id: "competitive", label: "Competitive Strategy" },
    { id: "growth", label: "Content & Growth" },
    { id: "launch", label: "Launch Plan" },
    { id: "investor", label: "Investor Strategy" },
    { id: "product", label: "Product Strategy" },
    { id: "ai", label: "AI/Agentic Strategy" },
    { id: "research", label: "Academic Research" },
    { id: "exit", label: "Exit Strategy" },
  ]

  const strategies: Record<string, { title: string; sections: { heading: string; items: string[] }[] }> = {
    gtm: {
      title: "Go-to-Market Strategy",
      sections: [
        {
          heading: "Target Audience",
          items: [
            "Primary: Ghanaians in diaspora planning to build or renovate a home in Ghana",
            "Secondary: Local Ghanaian property developers and real estate agents",
            "Tertiary: Architects, quantity surveyors, and contractors in Ghana",
            "Focus on cost-conscious DIY planners who want transparency before committing",
          ],
        },
        {
          heading: "Value Proposition",
          items: [
            "Save 2–4 weeks of research — get a detailed cost estimate in under 5 minutes",
            "Transparent, data-backed pricing — no more guesswork or inflated quotes",
            "First construction cost estimator purpose-built for the Ghanaian market",
            "Diaspora-friendly — pay with mobile money, cards, or PayPal via Paystack",
          ],
        },
        {
          heading: "Distribution Channels",
          items: [
            "SEO-first content strategy targeting 'cost of building in Ghana', 'building a house in Ghana cost', etc.",
            "Ghana-focused diaspora Facebook groups (Ghanaians Abroad, Ghana Association USA, etc.)",
            "LinkedIn outreach to Ghanaian real estate, construction, and diaspora professionals",
            "Partner with Ghanaian architects and quantity surveyors who refer clients",
            "WhatsApp sharing — reports are easy to forward within family WhatsApp groups",
            "YouTube — short videos showing sample estimates and walkthroughs",
          ],
        },
        {
          heading: "Early Traction Tactics",
          items: [
            "Free limited reports (1–2 rooms) to build trust and email list",
            "Discount code for first 100 users ('LAUNCH100')",
            "Collect testimonials from early paying users for social proof",
            "Publish 10+ SEO blog posts targeting long-tail keywords before paid ads",
          ],
        },
      ],
    },
    competitive: {
      title: "Competitive Strategy — Beat ExactoCost & Own the Market",
      sections: [
        {
          heading: "The Monopoly Thesis",
          items: [
            "Win the demand surface (everyone who wants to build), then the supply side (contractors) — ExactoCost only serves QS professionals",
            "We own the funnel: free estimate → paid report → contractor match. Whoever owns that funnel owns the market",
            "ExactoCost is the primary professional threat: SMM7/NRM2 BOQ workflows, published live supplier rates, free academic tier, AEO-savvy llms.txt",
            "Their weakness is structural: 4 of 16 regions, B2B-only, no consumer/diaspora, no ecosystem (no directory, no flood data, no API)",
          ],
        },
        {
          heading: "Phase 1 — Land-grab the free surface",
          items: [
            "Publish 16 regional cost pages with live rate tables + FAQ/JSON-LD (they have 4)",
            "Launch a public Ghana rate database page — mirror their transparency play with 4x coverage",
            "Keep the free calculator frictionless: no signup, no card, mobile money at checkout",
          ],
        },
        {
          heading: "Phase 2 — Win the professional segment",
          items: [
            "Add BOQ/Excel export + measurement-grade line items to Detailed/Premium reports (GHS 249 once vs their GHS 150/mo)",
            "Launch free academic tier for Ghanaian universities — intercept students before they pick ExactoCost",
            "Publish SMM7/NRM2 alignment note to win QS credibility",
          ],
        },
        {
          heading: "Phase 3 — SEO & AEO dominance",
          items: [
            "Target every keyword they rank for ('BOQ tool Ghana', 'how to prepare BOQ in Ghana') PLUS all homeowner/diaspora keywords",
            "Keep llms.txt fresh with hard rate data and keep AI crawlers open (already live)",
            "Weekly content cadence: 2 posts/week — rate data, region guides, cost guides",
          ],
        },
        {
          heading: "Phase 4 — Ecosystem moat",
          items: [
            "Bundle contractor directory + flood-risk + API + voice into every paid report",
            "Two-sided network effects: contractors pay to be listed where homeowners already estimate",
            "Open estimation API to banks, real-estate portals, and remittance platforms",
          ],
        },
        {
          heading: "First Strike (do now)",
          items: [
            "Build the 16-region cost data pages and public rate database — our data, their weakness",
            "Counters their transparency moat and owns SEO/AEO for every region keyword",
          ],
        },
      ],
    },
    revenue: {
      title: "Revenue & Monetization Strategy",
      sections: [
        {
          heading: "Core Product Tiers",
          items: [
            "Starter ($29) — Basic cost estimate for a single room or small project",
            "Standard ($79) — Full house estimate with breakdown by trade (foundation, roofing, finishing, etc.)",
            "Premium ($199) — Detailed estimate + materials list + timeline + PDF report",
            "Enterprise (Custom) — Multi-project estimates for developers; API access",
          ],
        },
        {
          heading: "Upsell Opportunities",
          items: [
            "PDF report download ($9.99 add-on for Starter tier)",
            "Excel spreadsheet export ($14.99 add-on)",
            "Professional review by a quantity surveyor ($49 consultation)",
            "Custom material cost analysis for specific regions ($99)",
          ],
        },
        {
          heading: "Recurring Revenue Paths",
          items: [
            "Monthly subscription ($19/mo) — unlimited estimates for DIY homeowners",
            "Pro plan ($49/mo) — for contractors and real estate agents (bulk estimates + client reports)",
            "Marketplace listing fees — connect users with verified contractors for a referral fee",
          ],
        },
        {
          heading: "Payment Infrastructure",
          items: [
            "Paystack for cards, mobile money (MTN, Vodafone, AirtelTigo), and bank transfers",
            "Coinbase Commerce for crypto (USDC, USDT, ETH, BTC) — USD-fixed checkout for diaspora",
            "Multi-currency pricing: USD for diaspora, GHS for local users",
            "Automatic receipt and invoice generation on successful payment",
          ],
        },
      ],
    },
    diaspora: {
      title: "Diaspora Market Strategy",
      sections: [
        {
          heading: "Why the Diaspora?",
          items: [
            "Ghanaians abroad send over $3.5B in remittances annually — a significant portion for home construction",
            "Diaspora homeowners face the most uncertainty: they can't easily visit sites, compare quotes, or verify costs",
            "Higher willingness to pay for reliable information to avoid being overcharged",
            "English-fluent, digitally native, and accustomed to paying for SaaS tools",
          ],
        },
        {
          heading: "Acquisition Channels",
          items: [
            "Facebook groups: Ghanaians in USA, Ghanaians in Canada, Ghanaians in UK, Ghana Association networks",
            "Diaspora-focused WhatsApp groups for real estate and construction",
            "Partnership with diaspora remittance services (Wise, WorldRemit, Azimo) for cross-promotion",
            "Sponsored content in diaspora digital media (Joy Online, GhanaWeb, Citinewsroom)",
            "YouTube ads targeting Ghanaian diaspora keywords",
          ],
        },
        {
          heading: "Trust Building for Diaspora Users",
          items: [
            "Display sample reports on landing page so users know exactly what they'll get",
            "Include local Ghanaian references (cedi prices, regional cost variations like Accra vs Kumasi)",
            "Publish case studies of real projects with actual cost data",
            "Offer money-back guarantee if estimate is significantly off (builds confidence)",
            "Provide WhatsApp support line — diaspora users value direct communication",
          ],
        },
        {
          heading: "Seasonal Timing",
          items: [
            "Peak interest during Ghanaian holidays (Christmas, Easter) when diaspora travel home",
            "Back-to-school season (Aug-Sept) — parents planning home improvements",
            "January — New Year resolutions to build/renovate",
            "Run targeted campaigns 4–6 weeks before these periods",
          ],
        },
      ],
    },
    growth: {
      title: "Content & Growth Strategy",
      sections: [
        {
          heading: "SEO Content Pillars",
          items: [
            "Cost guides: 'Cost to Build a 3-Bedroom House in Ghana 2025' (high-volume, high-intent)",
            "Comparison posts: 'Building in Accra vs Kumasi — Cost Comparison'",
            "How-to guides: 'How to Estimate Construction Costs for Your Dream Home'",
            "Regional breakdowns: 'Cost of Building Materials in Ghana — 2025 Prices'",
            "Process guides: 'Step-by-Step Guide to Building a House in Ghana from Abroad'",
          ],
        },
        {
          heading: "Social Media Strategy",
          items: [
            "LinkedIn: Share construction cost insights, data-driven posts, industry partnerships",
            "YouTube: 'I estimated the cost of a 4-bedroom house in Ghana in 3 minutes' (demo videos)",
            "TikTok/Instagram Reels: Short-form educational content ('How much does it cost to build in Ghana?')",
            "Twitter/X: Share industry facts, cost statistics, and engage construction community",
            "Facebook: Long-form posts in diaspora groups with report examples",
          ],
        },
        {
          heading: "Viral Loops & Referrals",
          items: [
            "Referral program: Give $5 credit for every friend who purchases a report",
            "Shareable reports: Each PDF includes a branded footer with a referral link",
            "Group buying: Discount when family members pool to estimate multiple properties",
            "User-generated content: Encourage users to share their report results on social media",
          ],
        },
        {
          heading: "Partnerships",
          items: [
            "Ghana Real Estate Developers Association (GREDA) — official estimator tool partner",
            "Ghana Institution of Surveyors — professional endorsement for data accuracy",
            "Ghanaian banks (GCB, Stanbic) — tool for home loan applicants to estimate construction costs",
            "Diaspora associations (Ghana USA Chamber of Commerce, Ghana Canada Association)",
            "Real estate portals (Meqasa, Tonaton) — embed calculator widget on property listings",
          ],
        },
      ],
    },
    launch: {
      title: "Launch Plan",
      sections: [
        {
          heading: "Phase 1: Soft Launch (Current — Week 1–2)",
          items: [
            "Verify: core estimate calculator works end-to-end with correct pricing",
            "Verify: payment flow (Paystack) produces successful transactions",
            "Verify: PDF report generation and email delivery (Resend)",
            "Fix all critical bugs and security issues from audit (Phase 2 of Roadmap)",
            "Set production API keys for Paystack, Resend, UploadThing",
            "Manual testing by founder: run 10+ different estimates, pay, verify reports",
          ],
        },
        {
          heading: "Phase 2: Beta Launch (Week 3–4)",
          items: [
            "Invite 50–100 trusted users (friends, family, diaspora network) for free access",
            "Collect feedback on pricing accuracy, UI clarity, and report usefulness",
            "Iterate on pricing model based on willingness-to-pay signals",
            "Publish 3–5 SEO blog posts to start building organic presence",
            "Set up analytics (Vercel Analytics + Google Analytics) to track user behavior",
          ],
        },
        {
          heading: "Phase 3: Public Launch (Week 5–6)",
          items: [
            "LAUNCH100 discount: 50% off first report for first 100 paid users",
            "Push across all diaspora channels simultaneously",
            "Pitch to Ghanaian tech media (TechCabal, Benjamindada, GhanaTech)",
            "Launch referral program with $5 credit",
            "Begin YouTube content creation with 2–3 estimate walkthrough videos",
          ],
        },
        {
          heading: "Phase 4: Growth (Week 7+)",
          items: [
            "Scale SEO content to 20+ articles targeting long-tail keywords",
            "Begin paid acquisition (Facebook/Instagram ads targeting diaspora interests)",
            "Reach out to GREDA and Ghana Surveyors for partnership discussions",
            "Develop subscription pricing tier for recurring users",
            "Explore contractor marketplace feature for Phase 2 of product",
          ],
        },
      ],
    },
    investor: {
      title: "Investor Strategy",
      sections: [
        {
          heading: "Fundraising Roadmap",
          items: [
            "Pre-seed ($50K–$100K): Founder / friends & family / diaspora angel investors — build MVP, validate demand, 100 paid users",
            "Seed ($300K–$500K): AngelList / African diaspora VCs — scale content, hire, build contractor marketplace",
            "Series A ($1M–$2M): Institutional VCs focused on African proptech — expand to Nigeria, Kenya, other African markets",
          ],
        },
        {
          heading: "Key Metrics for Fundraising",
          items: [
            "Monthly active users (MAU) and estimate completion rate",
            "Conversion rate: visitor → estimate → paid report",
            "Customer acquisition cost (CAC) by channel (SEO, paid, referral)",
            "Lifetime value (LTV): average reports purchased per user × average order value",
            "Gross margin (should be 80%+ — hosting costs are low)",
            "Net revenue retention (target 100%+ through upsells and subscriptions)",
          ],
        },
        {
          heading: "Target Investor Profile",
          items: [
            "African diaspora-focused funds: Founders Factory Africa, TLcom Capital, Ventures Platform",
            "Proptech and construction-tech funds: MetaProp, Fifth Wall, Pi Labs",
            "Angel investors from Ghanaian / Nigerian diaspora with construction or real estate background",
            "Ghana-based VC: Jaza Ripple, Equinox Partners, MEST Africa",
          ],
        },
        {
          heading: "Pitch Narrative",
          items: [
            "Problem: Building a home in Ghana as a diaspora is opaque, expensive, and trust-deficient",
            "Solution: 5-minute detailed cost estimate with accurate local pricing data",
            "Market size: $3.5B+ in annual remittances to Ghana; 2M+ Ghanaians in diaspora",
            "Traction: [X] paid users, [Y]% conversion, [Z]% repeat rate (update as available)",
            "Moats: Local pricing data network, SEO content moat, partnership integrations with real estate platforms",
            "Ask: $XXXK for 18 months runway to reach 10K paid users",
          ],
        },
      ],
    },
    product: {
      title: "Product Strategy",
      sections: [
        {
          heading: "MVP (Current — Shipped)",
          items: [
            "Multi-step construction cost calculator (All-in, Room-by-Room, Materials)",
            "3 pricing tiers ($29 / $79 / $199) with Paystack payment",
            "PDF report download with cost breakdown",
            "Admin dashboard with orders, messages, leads, newsletter",
            "Blog with SEO-optimized content",
            "Maintenance mode for site updates",
          ],
        },
        {
          heading: "Phase 2: Engagement (Next 3 Months)",
          items: [
            "User dashboard with order history and report re-downloads",
            "Email delivery of reports via Resend",
            "Payment receipts and invoices",
            "Interactive cost breakdown charts in the browser (no PDF required)",
            "Save and compare multiple estimates side-by-side",
            "Regional cost selector (Accra, Kumasi, Takoradi, other regions)",
          ],
        },
        {
          heading: "Phase 3: Marketplace (6–9 Months)",
          items: [
            "Verified contractor directory with profiles, reviews, and past projects",
            "Request quotes from contractors based on your estimate",
            "Contractor bidding system for larger projects",
            "Commission/fee on successful contractor matches",
            "Project management dashboard for active builds",
          ],
        },
        {
          heading: "Phase 4: Platform (12+ Months)",
          items: [
            "AI-powered cost prediction based on historical project data",
            "Real-time material price tracking from Ghanaian suppliers",
            "Mobile app (React Native) for on-site estimating",
            "Multi-market expansion (Nigeria, Kenya, other African countries)",
            "API for real estate platforms and banks to embed estimates",
          ],
        },
      ],
    },
    ai: {
      title: "AI & Agentic Strategy",
      sections: [
        {
          heading: "Vision",
          items: [
            "Make BuildCost GH the first autonomous construction cost intelligence platform in Africa",
            "Eliminate manual estimation entirely — AI handles data collection, pricing updates, and report generation",
            "Agents replace the workflow: user describes project → agent researches prices → agent generates estimate → agent delivers report",
          ],
        },
        {
          heading: "Phase 1: AI-Assisted (Now — 3 Months)",
          items: [
            "AI-powered material price suggestions from web-scraped Ghanaian supplier data",
            "Smart location-based cost adjustments using historical estimate data",
            "Automated PDF report generation with natural-language summary",
            "Chat-based estimate refinement (user asks 'what if I add a second floor?')",
          ],
        },
        {
          heading: "Phase 2: Agentic Workflows (3–9 Months)",
          items: [
            "PriceBot agent: continuously monitors supplier pricing (cement, steel, roofing, etc.) and updates database",
            "EstimateBot agent: accepts natural language project descriptions and returns complete estimates",
            "ContractorMatch agent: finds and recommends verified contractors based on project scope and location",
            "EmailBot agent: sends follow-ups, re-engagement campaigns, and report delivery via Resend",
            "All agents coordinated by a simple orchestrator — human-in-the-loop for approvals",
          ],
        },
        {
          heading: "Phase 3: Autonomous Platform (9–18 Months)",
          items: [
            "Multi-agent system: PriceBot + EstimateBot + ContractorMatch + FinanceBot work together on a project",
            "Agent memory: learns user preferences, frequent project types, and regional cost patterns",
            "Auto-quoting: contractors receive AI-matched project leads and can auto-bid within parameters",
            "Predictive analytics: forecasts cost trends by region, material, and season",
            "API agents: expose agent capabilities to third-party platforms (real estate sites, banks, fintech apps)",
          ],
        },
        {
          heading: "Technical Approach",
          items: [
            "OpenAI / Claude API for natural language understanding and estimate reasoning",
            "Vector embeddings on historical estimates for similarity-based cost prediction",
            "Web scraping agents (Puppeteer/Playwright) for supplier price tracking",
            "LangChain or custom agent framework for orchestrating multi-agent workflows",
            "Postgres + pgvector for storing and querying cost embeddings",
            "Human review layer for estimates above $50K or high-confidence discrepancy flags",
          ],
        },
        {
          heading: "Competitive Moat",
          items: [
            "Data network effect: each estimate improves model accuracy for the next user",
            "Real-time pricing data no competitor can replicate without our supplier network",
            "Agentic workflows reduce cost per estimate to near-zero over time",
            "First-mover advantage in AI-powered construction estimation for West Africa",
          ],
        },
        {
          heading: "Key Metrics",
          items: [
            "AI-assisted estimate completion time: < 2 minutes (target)",
            "Agent price accuracy: within 5% of manual QS benchmark",
            "Percentage of fully automated estimates (no human review): target 70% by Phase 3",
            "Supplier price data freshness: < 24 hours for top 50 materials",
            "User satisfaction score for AI-generated reports: target 4.5 / 5",
          ],
        },
      ],
    },
    research: {
      title: "Academic Research & University Partnerships",
      sections: [
        {
          heading: "Why Academic Research Matters",
          items: [
            "GhanaHousePlanner's UCC/KNUST study gives them credibility — BuildCost GH lacks the same academic validation",
            "A peer-reviewed cost comparison study would differentiate BuildCost GH as the research-backed standard",
            "University partnerships open doors to grants, government contracts, and media coverage",
            "Student projects (theses, capstones) can generate free research output that benefits the platform",
            "Academic backing strengthens investor pitch: validated methodology reduces perceived risk",
          ],
        },
        {
          heading: "Target Universities & Departments",
          items: [
            "Kwame Nkrumah University of Science and Technology (KNUST) — Department of Construction Technology & Management",
            "University of Ghana, Legon — Department of Geography & Resource Development (urban planning focus)",
            "University of Cape Coast — School of Agriculture (rural/affordable housing focus)",
            "Ghana Institute of Management and Public Administration (GIMPA) — Real Estate program",
            "Accra Technical University — Building Technology department",
            "Regional: University for Development Studies (Tamale), WA Polytechnic, Ho Technical University",
          ],
        },
        {
          heading: "Research Proposal Topics",
          items: [
            "Study 1: 'Comparative Analysis of Construction Cost Estimation Platforms in Ghana' — benchmark BuildCost GH vs GhanaHousePlanner vs manual QS. Target: peer-reviewed journal (e.g., Journal of Engineering, Design and Technology)",
            "Study 2: 'Regional Cost Variation in Ghanaian Residential Construction: A Data-Driven Approach' — use platform data to publish the first academic study of cost differentials across all 16 regions",
            "Study 3: 'Diaspora Remittances and Construction Investment: The Role of Digital Estimation Tools' — survey-based study of diaspora builders who use the platform vs traditional methods",
            "Study 4: 'AI-Assisted Cost Estimation in Developing Economies: Accuracy, Adoption, and Impact' — publish findings on agentic estimation accuracy in the Ghanaian context",
            "Study 5: 'Material Price Volatility in West Africa: A Longitudinal Study' — leverage PriceBot data to track cement, steel, and roofing cost trends over 12-24 months",
          ],
        },
        {
          heading: "Partnership Model",
          items: [
            "Tier 1 — Data Access: Universities get free API access to pricing data for research purposes. BuildCost GH gets citation and co-authorship on papers",
            "Tier 2 — Sponsored Research: Fund a graduate student thesis (approx. GHS 15,000-25,000) that directly studies platform accuracy. Results published with BuildCost GH as industry partner",
            "Tier 3 — Research Lab: Establish a 'Construction Economics Lab' at a partner university with ongoing data feeds, joint supervision, and annual symposium",
            "Tier 4 — Chair Endowment: Fund a professorial chair in Construction Economics at KNUST or Legon (requires significant capital, target Phase 5)",
          ],
        },
        {
          heading: "Outreach Timeline",
          items: [
            "Month 1: Identify and contact 3-5 faculty leads at target universities via LinkedIn and email. Prepare a one-pager explaining the research opportunity",
            "Month 2: Schedule meetings with interested faculty. Offer Tier 1 data access immediately to build goodwill",
            "Month 3: Propose Study 1 (Comparative Analysis) and Study 2 (Regional Cost Variation) as initial collaborations",
            "Month 4-6: First student projects begin. Publish initial blog posts about the partnerships to build credibility",
            "Month 7-12: Target first conference presentation (e.g., Ghana Institution of Engineers annual conference) or journal submission",
            "Year 2: Formalize a MoU with at least one university. Expand to Tier 2-3 partnerships. Use research findings in investor materials and marketing",
          ],
        },
        {
          heading: "Expected Outcomes",
          items: [
            "2+ peer-reviewed publications within 12 months citing BuildCost GH methodology",
            "3+ active university partnerships with ongoing student research projects",
            "Media coverage of research findings (e.g., 'First academic study of construction costs across all 16 regions')",
            "Enhanced credibility in investor pitch: 'Research-backed, peer-validated cost data'",
            "Pipeline for hiring top graduates from partner universities",
            "Potential grant funding from Ghanaian government research councils or international development organizations",
          ],
        },
        {
          heading: "Budget Estimate",
          items: [
            "Tier 1 (Data access): ~$0-500/year per university (API infrastructure costs only)",
            "Tier 2 (Sponsored thesis): ~$1,500-3,000 per student project stipend",
            "Conference attendance + publication fees: ~$2,000-5,000 per year",
            "Research assistant part-time: ~$3,000-6,000 per year",
            "Total Year 1 budget: ~$8,000-15,000 — extremely high ROI for the credibility gain",
          ],
        },
      ],
    },
    exit: {
      title: "Exit Strategy",
      sections: [
        {
          heading: "Exit Philosophy",
          items: [
            "BuildCost GH is being built as a scalable, defensible business with or without an exit — but understanding the exit landscape informs key strategic decisions",
            "The Ghanaian and West African proptech/construction-tech space is nascent, making BuildCost GH an early consolidation target",
            "A well-timed exit (3-7 years) maximizes returns for founders, angel investors, and seed-stage backers",
            "Primary exit path: Strategic acquisition by a larger platform expanding into Africa. Secondary path: Growth equity buyout or Series A+ → long-term independent player",
          ],
        },
        {
          heading: "Likely Acquirers",
          items: [
            "Type 1 — Global Proptech: BuildZoom (US, $500M+ valuation), Houzz (US, est. $600M+), PlanRadar (EU, est. €200M+). These platforms seek Africa expansion and lack Ghana-specific cost data",
            "Type 2 — Pan-African Platforms: Fara, DiasporaBuild, or similar platforms building across Africa. Acquiring BuildCost GH gives them instant estimation engine + Ghana data",
            "Type 3 — African Financial Institutions: Banks (Ecobank, Stanbic, Access Bank) and fintechs (Paystack, Flutterwave, M-Pesa) expanding into construction finance. Estimation data underpins project loans",
            "Type 4 — Regional Construction Conglomerates: West African construction firms seeking digital transformation and cost data assets",
            "Type 5 — Private Equity / Growth Equity: African-focused funds (TLcom, Partech, IFC) backing vertical SaaS platforms with strong unit economics and data moats",
          ],
        },
        {
          heading: "Exit Timeline Scenarios",
          items: [
            "Scenario A — Fast Exit (18-36 months): Build a dominant position in Ghana (60%+ market share), demonstrate $1M+ ARR with 80%+ gross margins. Sell to a pan-African platform for $5-15M. Key risk: leaving money on the table",
            "Scenario B — Strategic Exit (3-5 years): Expand to Nigeria and Kenya, build contractor marketplace revenue, reach $3-5M ARR. Sell to global proptech or African financial institution for $15-40M",
            "Scenario C — Long-Build (5-7 years): Become the definitive construction OS for West Africa. $10M+ ARR with agentic AI moat. Exit to private equity or pursue Series B/C → IPO path. Valuation: $50-200M+",
            "Scenario D — Independence: Build a profitable, bootstrapped lifestyle business. $1-3M ARR, 40%+ margins, no outside investors. Sustainable dividend-paying company. No forced exit",
          ],
        },
        {
          heading: "Valuation Drivers (What Acquirers Care About)",
          items: [
            "ARR (Annual Recurring Revenue) — subscription revenue is valued 5-10x higher than one-time report sales. Transition to subscription model is critical for exit valuation",
            "Data Moat — unique Ghana cost database across 16 regions with 12+ months of history. The more data, the higher the premium",
            "Market Share — dominance in Ghana (70%+) makes the company a 'must-buy' for any platform entering West Africa",
            "Tech Stack — modern Next.js/TypeScript/PostgreSQL stack reduces integration cost for acquirers. AI agents add technology premium",
            "Team — retaining key technical and research talent post-acquisition increases offer price by 20-50%",
            "Growth Rate — YoY growth of 100%+ commands 10-15x revenue multiples. Below 50% drops to 3-5x",
          ],
        },
        {
          heading: "Preparation Checklist",
          items: [
            "Month 1-6: Clean cap table. Ensure all IP is assigned to the company (founder IP, contractor work). Set up proper financial records and audit trail",
            "Month 6-12: Achieve $100K+ ARR with subscription revenue >30% of total. This proves recurring revenue model before any serious M&A discussion",
            "Year 1-2: Build the data moat. 12+ months of pricing history across 16 regions is a meaningful barrier. Track and document all proprietary data sources",
            "Year 2-3: Develop the contractor marketplace. Two-sided marketplaces command 2-3x higher multiples than single-sided SaaS",
            "Year 2-3: File for relevant trademarks and patents (particularly around agentic estimation methodology). IP portfolio increases deal value",
            "Year 3+: Engage boutique M&A advisor with African tech experience. Begin proactive outreach to potential acquirers to build relationships before a formal process",
            "Ongoing: Maintain immaculate financial records, clean codebase, and organized data room. Acquirers start diligence within weeks of first conversation",
          ],
        },
        {
          heading: "Expected Exit Range",
          items: [
            "Conservative (18-36 months, Ghana-only): $3-8M exit to pan-African platform",
            "Moderate (3-5 years, Ghana + Nigeria): $15-30M exit to global proptech or bank",
            "Optimistic (5-7 years, West Africa, AI moat): $50-100M+ exit to PE or strategic",
            "Home Run (7+ years, pan-African OS): $100-500M+ IPO or large strategic exit",
            "Key insight: Every year of data accumulation doubles the valuation floor. The database is the asset that appreciates fastest",
          ],
        },
      ],
    },
  }
 
  const current = strategies[subTab]
  if (!current) return null

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-1.5">
        {subTabs.map((st) => (
          <button
            key={st.id}
            onClick={() => setSubTab(st.id)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              subTab === st.id
                ? "bg-emerald-100 text-emerald-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">{current.title}</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {current.sections.map((section) => (
            <div key={section.heading} className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {section.heading}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item} className="text-sm text-slate-600 leading-relaxed flex gap-2">
                    <span className="text-emerald-500 mt-1 flex-shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Product Ecosystem ── */
function EcosystemTab() {
  const [subTab, setSubTab] = useState("valuechain")

  const stages: EcosystemStage[] = [
    {
      phase: "1. Dream & Discovery", emoji: "💭", color: "from-sky-400 to-sky-600",
      pain: "I want to build in Ghana but have no idea where to start, what it costs, or if it's even feasible.",
      products: [
        "Free cost estimator (entry point — current MVP)",
        "Educational blog & video library ('Building in Ghana 101')",
        "ROI calculator for rental properties",
        "Feasibility quiz that recommends the right path",
        "Diaspora building guide ebook ($9.99 download)",
        "Live Q&A webinars with Ghana-based experts",
        "AI chatbot assistant for quick questions (WhatsApp integration)",
        "Curated list of vetted diaspora-focused real estate agents",
      ],
      revenue: "Free / Lead generation + $10 ebook",
      link: "→ connects to Cost Estimation",
    },
    {
      phase: "2. Land Acquisition", emoji: "🌍", color: "from-emerald-400 to-emerald-600",
      pain: "Finding genuine land with clean title is nearly impossible from abroad. Scams are rampant.",
      products: [
        "Verified land listing marketplace (vetted titles, GPS-tagged)",
        "Title search & due diligence service (partner with surveyors)",
        "Legal document review (partner law firms)",
        "Land valuation report",
        "Drone site survey & aerial mapping service",
        "GPS land boundary mapping & beacon installation",
        "Community chief / family head verification call",
        "Land litigation history check (court records search)",
      ],
      revenue: "Commission (3–5% per sale) + Legal referral fee",
      link: "→ feeds into Design & Permits",
    },
    {
      phase: "3. Design & Permits", emoji: "📐", color: "from-violet-400 to-violet-600",
      pain: "I need architectural plans that meet Ghanaian building codes and I can't manage the permit process remotely.",
      products: [
        "Pre-designed house plan catalog (buy & download, then customize)",
        "Custom architectural design service (partner architects)",
        "Building permit application assistant (submit on your behalf)",
        "Community bylaw compliance check",
        "3D exterior & interior visualization renderings",
        "Material takeoff quantity list from architectural plans",
        "Virtual design consultation (30-min video call with architect)",
        "Structural engineering review of plans",
      ],
      revenue: "Per-plan sale ($99–$499) + Permit processing fee",
      link: "→ feeds into Budgeting & Financing",
    },
    {
      phase: "4. Budgeting & Financing", emoji: "💰", color: "from-amber-400 to-amber-600",
      pain: "I don't know the true cost and I can't get a mortgage as a diaspora buyer.",
      products: [
        "Detailed cost estimate (CORE PRODUCT — shipped)",
        "Diaspora mortgage facilitation (partner with banks)",
        "Savings plan generator (how much to save monthly)",
        "Bank loan comparison tool",
        "Payment plan builder for staged construction",
        "Multi-property portfolio cost analysis (developers)",
        "Construction loan application support service",
        "Currency exchange planning tool (USD/GHS/GBP rates)",
        "Cost escalation & inflation contingency calculator",
      ],
      revenue: "Report sales + Affiliate fee from bank referrals",
      link: "→ feeds into Contractor Hiring",
    },
    {
      phase: "5. Contractor Marketplace", emoji: "👷", color: "from-orange-400 to-orange-600",
      pain: "Who do I trust? Every diaspora story includes a contractor who disappeared or overcharged.",
      products: [
        "Vetted contractor directory with profiles & past projects",
        "Bid comparison tool (get 3 quotes, compare side-by-side)",
        "Contractor background check (criminal, past litigation)",
        "Client review & rating system",
        "Escrow payment protection (milestone-based release)",
        "Contractor insurance verification service",
        "Project portfolio gallery with real photos & budgets",
        "Direct messaging & contract signing platform",
      ],
      revenue: "Contractor subscription ($29/mo) + Commission on matched projects (5%)",
      link: "→ feeds into Construction Management",
    },
    {
      phase: "6. Construction Management", emoji: "📊", color: "from-blue-400 to-blue-600",
      pain: "I'm 5,000 miles away. How do I know they're actually building? Is the money being used properly?",
      products: [
        "Project dashboard with milestone tracking (foundation → roofing → finishing)",
        "Scheduled photo/video progress reports",
        "Milestone-based payment release (hold funds, release on completion)",
        "Material delivery verification (photo of delivered materials)",
        "Weekly written status report for diaspora owners",
        "On-site coordinator visits (partner network)",
        "Live CCTV feed access for active construction sites",
        "Budget vs actual spend tracking with alerts",
        "Change order management & approval workflow",
      ],
      revenue: "Monthly subscription ($19–$49/mo per project)",
      link: "→ feeds into Materials Procurement",
    },
    {
      phase: "7. Materials Procurement", emoji: "🏗️", color: "from-stone-400 to-stone-600",
      pain: "Where do I buy quality materials without getting overcharged? Contractors inflate material prices.",
      products: [
        "Real-time material price index (cement, steel, roofing, tiles, paint)",
        "Verified supplier directory (wholesale prices)",
        "Bulk procurement coordination (buy together, save 10–15%)",
        "Material delivery tracking to site",
        "Quality verification (product testing partnership)",
        "Material quantity calculator (exact amounts needed)",
        "Supplier scorecard with delivery reliability ratings",
        "Price drop alerts & seasonal buying recommendations",
      ],
      revenue: "Supplier listing fee + Commission on orders (2–5%)",
      link: "→ feeds into Quality Assurance",
    },
    {
      phase: "8. Quality Assurance", emoji: "✅", color: "from-green-400 to-green-600",
      pain: "Is the foundation correct? Are the electricals up to code? I can't inspect it myself.",
      products: [
        "Independent site inspection service (engineer visits site)",
        "Photo documentation package (time-stamped, geo-tagged)",
        "Snag list / punch list management",
        "Engineer sign-off coordination for permits",
        "Structural integrity report",
        "Electrical & plumbing compliance testing",
        "Soil test & foundation suitability analysis",
        "Thermal imaging inspection for insulation & moisture",
      ],
      revenue: "Per-inspection fee ($49–$149)",
      link: "→ feeds into Interior & Finishing",
    },
    {
      phase: "9. Interior & Finishing", emoji: "✨", color: "from-pink-400 to-pink-600",
      pain: "I want a beautiful home. Where do I find quality fixtures, furniture, and skilled finishers in Ghana?",
      products: [
        "Interior design consultation (virtual — partner designers)",
        "Furniture & fixture marketplace (delivered to site)",
        "Specialized contractor listing (tilers, painters, cabinet makers)",
        "Smart home installation service",
        "Landscaping design & execution",
        "Custom kitchen & wardrobe design service",
        "Paint color visualization tool (upload room photo, try colors)",
        "Lighting design & plan service",
      ],
      revenue: "Commission on sales (10–15%) + Designer referral fee",
      link: "→ feeds into Move-in & Property Management",
    },
    {
      phase: "10. Move-in & Property Management", emoji: "🏠", color: "from-teal-400 to-teal-600",
      pain: "I need to move in, maintain the property, or rent it out. I can't do this from abroad.",
      products: [
        "Moving services (partner network)",
        "Home maintenance & repair directory (plumbers, electricians, etc.)",
        "Full property management service (tenant finding, rent collection, maintenance)",
        "Rental listing platform (if building for investment)",
        "Home insurance referral",
        "Security system installation partner",
        "Property handover inspection checklist & walkthrough",
        "Utility connection setup service (water, electricity, internet)",
        "Yearly maintenance reminder & scheduling",
      ],
      revenue: "Property management fee (8–12% of rent) + Insurance commission",
      link: "→ Returns to Dream: refer friends, start next project",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-1.5">
        <button onClick={() => setSubTab("valuechain")}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${subTab === "valuechain" ? "bg-emerald-100 text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
          Value Chain
        </button>
        <button onClick={() => setSubTab("businessmodel")}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${subTab === "businessmodel" ? "bg-emerald-100 text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
          Business Model
        </button>
        <button onClick={() => setSubTab("revenuemodel")}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${subTab === "revenuemodel" ? "bg-emerald-100 text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
          Revenue Model
        </button>
        <button onClick={() => setSubTab("annualrevenue")}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${subTab === "annualrevenue" ? "bg-emerald-100 text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
          Annual Revenue Potential
        </button>
        <button onClick={() => setSubTab("pricingaudit")}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${subTab === "pricingaudit" ? "bg-emerald-100 text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
          Pricing Audit
        </button>
      </div>

      {subTab === "valuechain" ? <ValueChainView stages={stages} /> :
       subTab === "businessmodel" ? <BusinessModelView /> :
       subTab === "revenuemodel" ? <RevenueModelView /> :
       subTab === "annualrevenue" ? <AnnualRevenueView /> :
       <PricingAuditView />}
    </div>
  )
}

/* ── Value Chain (sub-view) ── */
function ValueChainView({ stages }: { stages: EcosystemStage[] }) {
  const totalRevenue = stages.reduce((sum, s: EcosystemStage) => {
    const nums = s.revenue.match(/\d+/g)
    return sum + (nums ? nums.reduce((a: number, b: string) => a + parseInt(b), 0) : 0)
  }, 0)

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Product Ecosystem</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
          The complete value chain for a Ghanaian diaspora user — from dreaming about a home to moving in.
          Each stage is a product opportunity. Our ecosystem captures the user early and monetizes them
          repeatedly across the entire journey.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">10</div>
          <div className="text-xs text-slate-500 mt-1">Value Chain Stages</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">~${totalRevenue / 10}K–${totalRevenue / 5}K</div>
          <div className="text-xs text-slate-500 mt-1">Est. Revenue per User (lifetime)</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">35+</div>
          <div className="text-xs text-slate-500 mt-1">Shippable Products</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600">10x</div>
          <div className="text-xs text-slate-500 mt-1">LTV vs Single Report Purchase</div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-emerald-200 hidden md:block" />
        <div className="space-y-6">
          {stages.map((stage: EcosystemStage, i: number) => (
            <div key={stage.phase} className="relative md:pl-16">
              <div className={`absolute left-4 top-6 w-4 h-4 rounded-full border-2 border-white shadow-md bg-gradient-to-br ${stage.color} hidden md:block`} />
              {i < stages.length - 1 && (
                <div className="hidden md:flex items-center justify-center text-emerald-400 text-xs font-medium mt-1 mb-1 ml-1">↓</div>
              )}
              <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
                <div className={`bg-gradient-to-r ${stage.color} p-4 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{stage.emoji}</span>
                      <h3 className="font-bold">{stage.phase}</h3>
                    </div>
                    <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">{stage.revenue}</span>
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-1">Pain Point</div>
                    <p className="text-sm text-slate-600 italic">&ldquo;{stage.pain}&rdquo;</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">Our Products</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {stage.products.map((p: string) => (
                        <div key={p} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-emerald-500 mt-0.5 flex-shrink-0">✦</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-dashed text-xs text-slate-400">{stage.link}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Ecosystem Flywheel Dynamics</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-xl bg-slate-50">
            <div className="text-lg font-bold text-emerald-600 mb-1">Data Moat</div>
            <p className="text-sm text-slate-600">Each stage generates proprietary data: real material prices, contractor performance scores, actual project costs. This data makes our estimates more accurate and our marketplace more valuable — competitors can&apos;t replicate it.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50">
            <div className="text-lg font-bold text-emerald-600 mb-1">Network Effects</div>
            <p className="text-sm text-slate-600">More homeowners → more contractors → better matching → more homeowners. More suppliers → better prices → more material orders → more suppliers. Each marketplace feeds the next.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50">
            <div className="text-lg font-bold text-emerald-600 mb-1">LTV Expansion</div>
            <p className="text-sm text-slate-600">A single report buyer ($29) becomes a contractor finder (5% commission), then a project management subscriber ($49/mo × 12 months). LTV grows from $29 to $2,000+ per user.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Business Model (sub-view) ── */
function BusinessModelView() {
  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-br from-amber-50 to-orange-50 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Business Model</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
          BuildCost.GH operates as a multi-sided platform with <strong>transactional, subscription, and commission-based</strong> revenue.
          Each product in the ecosystem is designed to maximize lifetime value by moving users from one-time purchases into
          recurring revenue streams.
        </p>
      </div>

      {/* Unit economics snapshot */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Revenue Model", value: "Hybrid", sub: "Transactional + Subscription + Commission" },
          { label: "Est. Blended Gross Margin", value: "78%", sub: "Weighted across all streams", color: true },
          { label: "Target LTV:CAC Ratio", value: "5:1", sub: "LTV ~$800+ / CAC ~$150", color: true },
          { label: "Path to Profitability", value: "M9–12", sub: "At ~$12.5K+/mo MRR breakeven", color: true },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{c.label}</div>
            <div className={`text-lg font-bold ${c.color ? "text-emerald-600" : "text-slate-900"}`}>{c.value}</div>
            <div className="text-sm text-slate-500 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Business model canvas */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Business Model Canvas</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { bg: "bg-sky-50", title: "Key Partners", items: ["Architects & QS firms", "Land surveyors & lawyers", "Banks (diaspora mortgages)", "Material suppliers", "Insurance companies", "Ghana Land Commission"] },
            { bg: "bg-emerald-50", title: "Key Activities", items: ["Cost data aggregation & accuracy", "Platform development", "Partner network management", "SEO content production", "Diaspora community building"] },
            { bg: "bg-purple-50", title: "Value Propositions", items: ["Transparency — know real costs", "Trust — vetted partners", "Convenience — manage from abroad", "Data — Ghana-specific pricing", "End-to-end — one platform"] },
            { bg: "bg-amber-50", title: "Customer Relationships", items: ["WhatsApp support", "Email onboarding", "Facebook community group", "Account manager (enterprise)"] },
            { bg: "bg-rose-50", title: "Customer Segments", items: ["Ghanaian diaspora (primary)", "Local property developers", "Real estate agents", "Architects & contractors", "Banks & insurance companies"] },
            { bg: "bg-teal-50", title: "Key Resources", items: ["Pricing data (proprietary)", "Platform & calculator tech", "Partner network", "SEO content library", "Diaspora community trust"] },
            { bg: "bg-indigo-50", title: "Channels", items: ["SEO / organic search", "Facebook diaspora groups", "YouTube (demo videos)", "LinkedIn (professionals)", "WhatsApp viral sharing", "Partner referrals"] },
            { bg: "bg-orange-50", title: "Cost Structure", items: ["~$6K/mo lean burn", "Biggest: Marketing (30%)", "Content production (25%)", "Ops & support (15%)", "Infrastructure (15%)"] },
            { bg: "bg-lime-50", title: "Revenue Streams", items: ["16 identified streams", "Blended margin ~78%", "Target Y1: ~$310K", "MRR by M12: ~$35K", "LTV:CAC target: 5:1"] },
          ].map((block) => (
            <div key={block.title} className={`p-3 rounded-lg ${block.bg}`}>
              <div className="text-xs font-bold text-slate-700 uppercase mb-1">{block.title}</div>
              <ul className="text-xs text-slate-700 space-y-1">{block.items.map((i) => <li key={i}>• {i}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>

      {/* Cost structure */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-3">Cost Structure Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { item: "Sales & Marketing (paid ads, partnerships)", pct: "30%", amount: "$2,000/mo", desc: "Facebook/Google ads targeting diaspora. Initial organic focus to validate." },
            { item: "Content & SEO (writers, video, design)", pct: "25%", amount: "$1,500/mo", desc: "Freelance writers ($200/article), video production ($500/video), design assets." },
            { item: "Operations & Support (VA, partners)", pct: "15%", amount: "$1,000/mo", desc: "Customer support (chat/email), partner payout management, admin." },
            { item: "Hosting & Infrastructure (Vercel + Neon + UploadThing)", pct: "15%", amount: "$200/mo", desc: "Scales with traffic. Vercel Pro $20, Neon $0–$25, UploadThing $10." },
            { item: "Product Development (tools, AI credits)", pct: "10%", amount: "$800/mo", desc: "LLM API costs for AI features, design tools, Sentry monitoring." },
            { item: "Payment Processing (Paystack fees)", pct: "5%", amount: "Variable", desc: "1.5% + $0.20 local cards, 3.5% intl cards. Scales with revenue." },
          ].map((c) => (
            <div key={c.item} className="flex items-start justify-between gap-3 border-b border-dashed pb-2 last:border-0">
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-800">{c.item}</div>
                <div className="text-xs text-slate-500">{c.desc}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-semibold text-slate-900">{c.pct}</div>
                <div className="text-xs text-slate-400">{c.amount}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t flex justify-between text-sm font-bold text-slate-900">
          <span>Est. Monthly Burn (Lean)</span>
          <span className="text-emerald-600">~$6,000</span>
        </div>
      </div>

      {/* Key metrics */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Key Metrics to Track</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Revenue Metrics", items: ["MRR / ARR", "Avg Revenue Per User (ARPU)", "LTV (12-month)", "Blended Gross Margin", "Net Revenue Retention"] },
            { label: "Acquisition Metrics", items: ["CAC by channel", "CAC payback period", "Conversion rate (visit → paid)", "Organic vs paid split", "Referral rate"] },
            { label: "Engagement Metrics", items: ["Reports completed/week", "Ecosystem adoption (# stages used)", "Monthly active users", "Avg session duration", "Report → marketplace conversion"] },
            { label: "Platform Metrics", items: ["# contractors listed", "# suppliers listed", "# properties managed", "Marketplace GMV", "Platform take rate"] },
          ].map((group) => (
            <div key={group.label}>
              <div className="text-sm font-semibold text-slate-700 mb-2">{group.label}</div>
              <ul className="space-y-1">{group.items.map((item) => <li key={item} className="text-xs text-slate-500 flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400" />{item}</li>)}</ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Revenue Model (sub-view) ── */
function RevenueModelView() {
  const streams = [
    { name: "Cost Reports (One-Time)", est: "$29–$199", margin: "85%", type: "Transactional", stage: 4, freq: "Per purchase", notes: "Core product. Near-zero marginal cost after calculator is built." },
    { name: "PDF / Excel Add-ons", est: "$10–$15", margin: "90%", type: "Transactional", stage: 4, freq: "Per download", notes: "Upsell from free/Starter tier. Pure digital delivery." },
    { name: "QS Consultation", est: "$49", margin: "60%", type: "Service", stage: 4, freq: "Per session", notes: "Partner with licensed quantity surveyors. Revenue share." },
    { name: "House Plan Catalog", est: "$99–$499", margin: "70%", type: "Transactional", stage: 3, freq: "Per download", notes: "Pre-designed plans. Partner architects get 40% rev share." },
    { name: "Permit Processing", est: "$50–$150", margin: "50%", type: "Service", stage: 3, freq: "Per project", notes: "Fee for handling permit apps. Labour-intensive, scales with local hires." },
    { name: "Land Sale Commission", est: "3–5%", margin: "80%", type: "Commission", stage: 2, freq: "Per transaction", notes: "Broker commission on verified land listings. High-value, low volume." },
    { name: "Contractor Subscriptions", est: "$29/mo", margin: "90%", type: "Subscription", stage: 5, freq: "Monthly", notes: "Contractors pay to be listed. Target 500+ in year 1." },
    { name: "Project Matching Fee", est: "5%", margin: "85%", type: "Commission", stage: 5, freq: "Per project", notes: "Commission on contractor projects. Avg project $10K–$50K." },
    { name: "Project Management SaaS", est: "$19–$49/mo", margin: "80%", type: "Subscription", stage: 6, freq: "Monthly", notes: "Recurring subscription for project tracking." },
    { name: "Material Order Commission", est: "2–5%", margin: "75%", type: "Commission", stage: 7, freq: "Per order", notes: "Commission on supplier transactions. Avg order $500–$5,000." },
    { name: "Supplier Listings", est: "$19/mo", margin: "90%", type: "Subscription", stage: 7, freq: "Monthly", notes: "Suppliers pay for verified listing + analytics." },
    { name: "Site Inspection", est: "$49–$149", margin: "55%", type: "Service", stage: 8, freq: "Per visit", notes: "Engineer visit fee. Partner rev share 60/40." },
    { name: "Furniture/Fixture Commission", est: "10–15%", margin: "70%", type: "Commission", stage: 9, freq: "Per sale", notes: "Marketplace commission on interior goods." },
    { name: "Property Management", est: "8–12% of rent", margin: "60%", type: "Subscription", stage: 10, freq: "Monthly", notes: "Ongoing mgmt fee. Recurring, tied to rental income." },
    { name: "Insurance Commission", est: "10–15%", margin: "80%", type: "Commission", stage: 10, freq: "Per policy", notes: "Referral fee from insurance partners." },
    { name: "Bank/Affiliate Referrals", est: "Fixed/lead", margin: "90%", type: "Commission", stage: 4, freq: "Per lead", notes: "Refer diaspora clients for mortgages. CPA model." },
  ]

  const types = [...new Set(streams.map((s) => s.type))]
  const stageNames = ["", "Dream", "Land", "Design", "Budget", "Contractor", "Construction", "Materials", "QA", "Interior", "Move-in"]

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Revenue Model</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
          16 revenue streams organized by type and value chain stage. The model is designed to capture
          value at every touchpoint — from a one-time report purchase to recurring property management fees.
        </p>
      </div>

      {/* Revenue type summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { type: "Transactional", count: 3, est: "$29–$499", margin: "82%", icon: "🛒", desc: "One-time purchases: reports, plans, add-ons" },
          { type: "Subscription", count: 4, est: "$19–$49/mo", margin: "80%", icon: "🔄", desc: "Recurring: contractor listing, PM SaaS, supplier, property mgmt" },
          { type: "Commission", count: 6, est: "2–15%", margin: "77%", icon: "📊", desc: "Per-transaction: land, projects, materials, insurance, referrals" },
          { type: "Service", count: 3, est: "$49–$150", margin: "55%", icon: "🔧", desc: "Labour-based: QS consultation, permits, site inspections" },
        ].map((t) => (
          <div key={t.type} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{t.icon}</span>
              <div>
                <div className="font-semibold text-slate-800">{t.type}</div>
                <div className="text-xs text-slate-400">{t.count} streams</div>
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Price range</span>
              <span className="font-medium text-slate-800">{t.est}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Avg margin</span>
              <span className="font-medium text-emerald-600">{t.margin}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Revenue streams table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-900">Revenue Streams — Full Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Revenue Stream</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Price</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Margin</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Stage</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Frequency</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Notes</th>
              </tr>
            </thead>
            <tbody>
              {streams.map((s, i) => (
                <tr key={s.name} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                  <td className="px-5 py-3 font-medium text-slate-800">{s.name}</td>
                  <td className="px-5 py-3 text-emerald-600 font-medium whitespace-nowrap">{s.est}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      parseInt(s.margin) >= 80 ? "bg-emerald-100 text-emerald-700" :
                      parseInt(s.margin) >= 60 ? "bg-amber-100 text-amber-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>{s.margin}</span>
                  </td>
                  <td className="px-5 py-3"><span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">{s.type}</span></td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{stageNames[s.stage]}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{s.freq}</td>
                  <td className="px-5 py-3 text-slate-500 max-w-xs text-xs">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by value chain stage */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Revenue by Value Chain Stage</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stageNames.slice(1).map((name, i) => {
            const stageStreams = streams.filter((s) => s.stage === i + 1)
            if (!stageStreams.length) return null
            const avgMargin = Math.round(stageStreams.reduce((a, s) => a + parseInt(s.margin), 0) / stageStreams.length)
            return (
              <div key={name} className="border rounded-lg p-3">
                <div className="text-xs font-semibold text-slate-400 uppercase">Stage {i + 1}</div>
                <div className="text-sm font-bold text-slate-800 mb-1">{name}</div>
                <div className="text-xs text-slate-500">{stageStreams.length} streams</div>
                <div className="text-xs text-slate-500">Avg margin <span className="font-medium text-emerald-600">{avgMargin}%</span></div>
                <div className="mt-1 text-xs text-slate-400">{stageStreams.map((s) => s.name.split(" (")[0]).join(", ")}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Annual Revenue Potential (sub-view) ── */
function AnnualRevenueView() {
  const years = [
    {
      year: "Year 1 (MVP → Market Fit)",
      users: "5,000",
      mrr: "$35K",
      arr: "$310K",
      color: "text-emerald-600",
      quarters: [
        { label: "Q1 (M1–3)", users: 100, reports: 4500, subscriptions: 0, commissions: 0, services: 0, total: 4500, note: "Soft launch + beta. Free reports, build case studies." },
        { label: "Q2 (M4–6)", users: 500, reports: 18000, subscriptions: 2900, commissions: 0, services: 600, total: 21500, note: "Contractor subs + PM SaaS begin. SEO starts ranking." },
        { label: "Q3 (M7–9)", users: 2000, reports: 55000, subscriptions: 9500, commissions: 4000, services: 1500, total: 70000, note: "Land commissions + supplier fees start. Content flywheel." },
        { label: "Q4 (M10–12)", users: 5000, reports: 120000, subscriptions: 28000, commissions: 45000, services: 5000, total: 198000, note: "Property mgmt + insurance recurring. Full ecosystem live." },
      ],
    },
    {
      year: "Year 2 (Scale & Expand)",
      users: "25,000",
      mrr: "$175K",
      arr: "$1.8M",
      color: "text-blue-600",
      quarters: [
        { label: "Q1", users: 8000, reports: 175000, subscriptions: 55000, commissions: 95000, services: 15000, total: 340000, note: "Nigeria expansion prep. Contractor marketplace scales." },
        { label: "Q2", users: 12000, reports: 250000, subscriptions: 85000, commissions: 180000, services: 25000, total: 540000, note: "Land verification service launches. Bank partnerships active." },
        { label: "Q3", users: 18000, reports: 360000, subscriptions: 120000, commissions: 300000, services: 40000, total: 820000, note: "Property management portfolio grows. Insurance recurring." },
        { label: "Q4", users: 25000, reports: 450000, subscriptions: 180000, commissions: 450000, services: 60000, total: 1140000, note: "Full ecosystem across Ghana. 1,000+ contractors." },
      ],
    },
    {
      year: "Year 3 (Multi-Market Dominance)",
      users: "100,000",
      mrr: "$650K",
      arr: "$7.2M",
      color: "text-violet-600",
      quarters: [
        { label: "Q1", users: 35000, reports: 600000, subscriptions: 300000, commissions: 800000, services: 120000, total: 1820000, note: "Nigeria live. Kenya pilot. AI-powered cost prediction." },
        { label: "Q2", users: 50000, reports: 850000, subscriptions: 450000, commissions: 1400000, services: 200000, total: 2900000, note: "Mobile app launched. Real-time material pricing." },
        { label: "Q3", users: 75000, reports: 1200000, subscriptions: 650000, commissions: 2200000, services: 300000, total: 4350000, note: "Kenya scaled. Embedded API for banks & real estate portals." },
        { label: "Q4", users: 100000, reports: 1600000, subscriptions: 900000, commissions: 3200000, services: 450000, total: 6150000, note: "Dominant in 3 markets. 5,000+ contractors. 500+ suppliers." },
      ],
    },
  ]

  const tamSamSom = [
    { tier: "TAM (Total Addressable Market)", value: "$8.5B", desc: "Annual remittances to Ghana for housing + construction ($3.5B remittances × ~40% housing) + local construction spend ($5B+ SME/residential)" },
    { tier: "SAM (Serviceable Addressable Market)", value: "$1.2B", desc: "Diaspora Ghanaian homeowners actively building/planning (est. 200K projects/yr × $6K avg platform value)" },
    { tier: "SOM (Serviceable Obtainable Market)", value: "$48M", desc: "Year 3 target: 100K users × $480 avg platform revenue per user = ~4% of SAM" },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Annual Revenue Potential</h2>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">
          3-year financial projection based on phased ecosystem rollout. Conservative estimates assuming
          organic growth driven by SEO, diaspora referrals, and partner networks. Paid acquisition
          would accelerate timeline by 30–50%.
        </p>
      </div>

      {/* TAM / SAM / SOM */}
      <div className="grid gap-4 sm:grid-cols-3">
        {tamSamSom.map((t) => (
          <div key={t.tier} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{t.tier}</div>
            <div className="text-2xl font-bold text-emerald-600 mb-1">{t.value}</div>
            <div className="text-xs text-slate-500 leading-relaxed">{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Breakeven & revenue milestone markers */}
      <div className="rounded-xl border bg-amber-50 p-5">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-semibold text-slate-800">Key Milestones:</span>
          <span className="bg-white px-3 py-1 rounded-full border text-amber-700">Breakeven at ~$6K/mo (M9–12)</span>
          <span className="bg-white px-3 py-1 rounded-full border text-emerald-700">Y1 Target: $310K ARR</span>
          <span className="bg-white px-3 py-1 rounded-full border text-blue-700">Y2 Target: $1.8M ARR</span>
          <span className="bg-white px-3 py-1 rounded-full border text-violet-700">Y3 Target: $7.2M ARR</span>
          <span className="bg-white px-3 py-1 rounded-full border text-sky-700">4% SOM capture by Y3</span>
        </div>
      </div>

      {/* 3-year quarterly projection */}
      <div className="space-y-6">
        {years.map((y) => (
          <div key={y.year} className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className={`px-5 py-4 border-b flex items-center justify-between ${y.color.replace("text-", "bg-").replace("600", "50")}`}>
              <div>
                <h3 className="font-bold text-slate-900">{y.year}</h3>
                <div className="text-xs text-slate-500">{y.users} users · {y.mrr} MRR · {y.arr} ARR</div>
              </div>
              <div className={`text-2xl font-bold ${y.color}`}>{y.arr}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/50">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Quarter</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Users</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Reports</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Subscriptions</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Commissions</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Services</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Total</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {y.quarters.map((q) => (
                    <tr key={q.label} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium text-slate-700">{q.label}</td>
                      <td className="px-4 py-2.5 text-slate-600">{q.users.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-600">${q.reports.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-600">${q.subscriptions.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-600">${q.commissions.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-600">${q.services.toLocaleString()}</td>
                      <td className="px-4 py-2.5 font-semibold text-emerald-600">${q.total.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[200px]">{q.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue mix visualization */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Revenue Mix Evolution</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { year: "Year 1", total: "$310K", segments: [{ label: "Reports (one-time)", pct: 64, color: "bg-emerald-500" }, { label: "Subscriptions", pct: 13, color: "bg-blue-500" }, { label: "Commissions", pct: 16, color: "bg-amber-500" }, { label: "Services", pct: 7, color: "bg-violet-500" }] },
            { year: "Year 2", total: "$1.8M", segments: [{ label: "Reports", pct: 35, color: "bg-emerald-500" }, { label: "Subscriptions", pct: 20, color: "bg-blue-500" }, { label: "Commissions", pct: 36, color: "bg-amber-500" }, { label: "Services", pct: 9, color: "bg-violet-500" }] },
            { year: "Year 3", total: "$7.2M", segments: [{ label: "Reports", pct: 22, color: "bg-emerald-500" }, { label: "Subscriptions", pct: 25, color: "bg-blue-500" }, { label: "Commissions", pct: 44, color: "bg-amber-500" }, { label: "Services", pct: 9, color: "bg-violet-500" }] },
          ].map((mix) => (
            <div key={mix.year} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="font-bold text-slate-900">{mix.year}</div>
                <div className="text-lg font-bold text-emerald-600">{mix.total}</div>
              </div>
              <div className="space-y-2">
                {mix.segments.map((seg) => (
                  <div key={seg.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{seg.label}</span>
                      <span className="font-medium text-slate-700">{seg.pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${seg.color}`} style={{ width: `${seg.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Pricing Audit (sub-view) ── */
function PricingAuditView() {
  const [currency, setCurrency] = useState<"USD" | "GHS">("USD")
  const [rates, setRates] = useState<{ GHS: number }>({ GHS: 15.5 })
  const [rateDate, setRateDate] = useState("")

  useEffect(() => {
    getClientGhsRate()
      .then(({ rate, date }) => {
        if (rate > 0) {
          setRates({ GHS: rate })
          setRateDate(date || "")
        }
      })
      .catch(() => {})
  }, [])

  const rate = rates.GHS || 15.5
  const f = (usd: number) =>
    currency === "USD"
      ? `$${usd.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: usd >= 1 ? 0 : 2 })}`
      : `₵${(usd * rate).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const fn = (usd: number) =>
    currency === "USD"
      ? usd
      : Math.round(usd * rate)

  const tiers = [
    { name: "Starter", price: 29, target: "DIY homeowners, single-room estimate", value: "Basic cost breakdown by trade", competitors: "$0–$19 (freemium tools)", margin: "92%", vol: "High", score: 7 },
    { name: "Standard", price: 79, target: "Full house estimate, diaspora users", value: "Detailed estimate + regional costing", competitors: "N/A (unique to Ghana)", margin: "90%", vol: "Medium", score: 9 },
    { name: "Premium", price: 199, target: "Serious builders, property developers", value: "Full report + materials list + PDF + Excel", competitors: "N/A (no direct competitor)", margin: "88%", vol: "Low", score: 8 },
  ]

  const riskFactors = [
    { factor: "Willingness to Pay (WTP)", verdict: "POSITIVE", color: "text-emerald-600", detail: `Diaspora users pay $200+ for visa consultations, $500+ for legal fees. A ${f(79)}–${f(199)} report that saves them thousands in overcharges is well within WTP threshold.` },
    { factor: "Competitive Landscape", verdict: "FAVORABLE", color: "text-emerald-600", detail: "No direct competitor serving the Ghanaian market. International estimators (HomeAdvisor, CostCertified) don't have Ghana pricing data. Free alternatives (manual research) take 2–4 weeks." },
    { factor: "Value Perception", verdict: "STRONG", color: "text-emerald-600", detail: `Report saves users 2–4 weeks of research and prevents being overcharged by 20–50%. The ${f(79)} report on a $50K build is 0.16% of project cost — negligible relative to value.` },
    { factor: "Price Anchoring", verdict: "EFFECTIVE", color: "text-emerald-600", detail: `Three-tier structure (${f(29)} → ${f(79)} → ${f(199)}) anchors users to the middle tier. ${f(29)} feels low-risk, ${f(199)} feels premium, ${f(79)} feels like the 'smart choice'.` },
    { factor: "Regional Pricing (GHS)", verdict: "NEEDS WORK", color: "text-amber-600", detail: `Current pricing is USD-only. Ghanaian local users find ${f(29)}–${f(199)} expensive (GHS ${fn(29).toLocaleString()}–${fn(199).toLocaleString()}). Need local pricing tier at 40–50% of USD rates for local market penetration.` },
    { factor: "Subscription Viability", verdict: "UNTESTED", color: "text-amber-600", detail: "Monthly subscription for unlimited estimates assumes high repeat usage. Unclear if users need multiple estimates. Consider annual prepaid plans to reduce churn risk. All subscription tiers are PROPOSED — not yet built." },
    { factor: "Conversion Friction", verdict: "MODERATE RISK", color: "text-amber-600", detail: "Users complete 5-step calculator → see results → pay to unlock. Dropoff at payment screen is likely. Consider paywall placement: free summary + paid full report." },
    { factor: "Add-on Pricing", verdict: "OPPORTUNITY", color: "text-emerald-600", detail: `PDF download (${f(10)}), Excel (${f(15)}), QS review (${f(49)}) as add-ons increase AOV by 15–30%. Low marginal cost, high perceived value.` },
    { factor: "Enterprise / B2B Pricing", verdict: "UNPRICED", color: "text-amber-600", detail: "No pricing for real estate developers, banks, or government agencies who might need bulk estimates. Potential $500–$2,000/mo enterprise tier with API access. This is PROPOSED." },
    { factor: "Price Elasticity", verdict: "LOW (FAVORABLE)", color: "text-emerald-600", detail: "Target diaspora segment is price-insensitive relative to value received. A 20% price increase would reduce volume by <5% (inelastic demand at current levels)." },
  ]

  const recommendations = [
    { priority: "High", action: `Introduce GHS pricing tier at 50% of USD rates (e.g. ${f(40)} instead of ${f(79)})`, impact: "Unlocks local market (50%+ of Ghana's addressable users)", effort: "Low", timeline: "Week 1" },
    { priority: "High", action: "Add free estimate summary (20% of data) before paywall", impact: "Increases conversion by building trust & demonstrating value", effort: "Medium", timeline: "Week 2–3" },
    { priority: "High", action: "Build & launch annual subscription ($99/yr = $8.25/mo) for unlimited estimates", impact: "Creates recurring revenue, reduces churn vs monthly", effort: "Medium", timeline: "Week 3–4" },
    { priority: "Medium", action: "Introduce monthly subscription ($19/mo, unlimited basic estimates)", impact: "Opens recurring revenue stream, increases LTV 3–6x", effort: "Medium", timeline: "Month 2" },
    { priority: "Medium", action: "Run LAUNCH100 discount (50% off) — measure conversion uplift", impact: "Validates price sensitivity, builds initial user base", effort: "Low", timeline: "Week 1" },
    { priority: "Medium", action: "Create enterprise tier ($500–$2K/mo) with API access", impact: "High-value contracts with developers, banks, government", effort: "High", timeline: "Month 3–4" },
    { priority: "Low", action: "A/B test paywall placement (after step 3 vs after full calculation)", impact: "Data-driven optimization of conversion funnel", effort: "Medium", timeline: "Month 2–3" },
    { priority: "Low", action: "Test 'Pay What You Want' for first report (minimum $9)", impact: "Reduces entry barrier, collects WTP data", effort: "Low", timeline: "Month 3" },
  ]

  return (
    <div className="space-y-8">
      {/* Currency toggle + header */}
      <div className="rounded-2xl border bg-gradient-to-br from-rose-50 to-amber-50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Pricing Audit & Sustainability Analysis</h2>
            <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
              Evaluation of our current pricing model for market viability, competitive positioning,
              and long-term sustainability.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 shadow-sm border flex-shrink-0">
            <span className={`text-sm font-medium ${currency === "USD" ? "text-slate-800" : "text-slate-400"}`}>USD</span>
            <button
              onClick={() => setCurrency(currency === "USD" ? "GHS" : "USD")}
              className={`relative w-12 h-6 rounded-full transition-colors ${currency === "GHS" ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${currency === "GHS" ? "translate-x-6" : ""}`} />
            </button>
            <span className={`text-sm font-medium ${currency === "GHS" ? "text-slate-800" : "text-slate-400"}`}>GHS</span>
            {rateDate && (
              <span className="text-[10px] text-slate-400 hidden sm:block ml-1">
                Rate: 1 USD = {rate} GHS
                <br />{rateDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CURRENT MODEL — critical clarification banner */}
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <div className="font-bold text-amber-800 text-sm uppercase tracking-wide mb-1">Current Pricing Model: Per-Report (One-Time Purchase)</div>
            <p className="text-sm text-amber-700">
              We currently charge <strong>a single fee per report download</strong> — no subscriptions, no recurring billing.
              Users pay <strong>{f(29)} (Starter)</strong>, <strong>{f(79)} (Standard)</strong>, or <strong>{f(199)} (Premium)</strong> once and receive their report.
              There is <strong>no monthly or annual plan</strong> built yet.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="bg-white px-2.5 py-1 rounded-full border border-amber-200 text-amber-700">🟢 Per-report works for MVP validation</span>
              <span className="bg-white px-2.5 py-1 rounded-full border border-amber-200 text-amber-700">🟡 Subscriptions are PROPOSED — not shipped</span>
              <span className="bg-white px-2.5 py-1 rounded-full border border-amber-200 text-amber-700">🔴 No recurring revenue stream exists yet</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current pricing tiers — sustainability scorecard */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Current Tiers (Per-Report) — Sustainability Scorecard</h3>
          <span className="text-xs text-slate-400">All prices in {currency}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Tier</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Price (per report)</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Target</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Value Delivered</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Margin</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Volume</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Score</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((t, i) => (
                <tr key={t.name} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                  <td className="px-5 py-3 font-semibold text-slate-800">{t.name}</td>
                  <td className="px-5 py-3 font-bold text-emerald-600">{f(t.price)} <span className="text-[10px] font-normal text-slate-400">/report</span></td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{t.target}</td>
                  <td className="px-5 py-3 text-slate-600 text-xs">{t.value}</td>
                  <td className="px-5 py-3 text-emerald-600 font-medium">{t.margin}</td>
                  <td className="px-5 py-3 text-slate-600">{t.vol}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      t.score >= 8 ? "bg-emerald-100 text-emerald-700" :
                      t.score >= 6 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}>{t.score}/10</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk factor assessment */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">Risk Factor Assessment</h3>
        <div className="space-y-3">
          {riskFactors.map((r) => (
            <div key={r.factor} className="flex items-start gap-4 border-b border-dashed pb-3 last:border-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{r.factor}</span>
                  <span className={`text-xs font-bold ${r.color}`}>{r.verdict}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{r.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overall score summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Overall Sustainability", value: "7.5/10", color: "text-emerald-600", note: "Strong foundation, gaps in local pricing & recurring revenue" },
          { label: "Competitive Moat", value: "9/10", color: "text-emerald-600", note: "No direct competitor — data moat grows with every report" },
          { label: "Pricing Confidence", value: "7/10", color: "text-amber-600", note: "Tiers work but need local currency & subscription validation" },
          { label: "Scalability Score", value: "6/10", color: "text-amber-600", note: "B2B/enterprise pricing missing. Volume economics unproven" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4 shadow-sm text-center">
            <div className="text-xs font-semibold text-slate-400 uppercase mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.note}</div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-900">Pricing Recommendations</h3>
          <p className="text-xs text-amber-600 mt-0.5">* Items mentioning subscriptions are PROPOSED — requires development</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50/50">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Priority</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Action</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Impact</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Effort</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((r, i) => (
                <tr key={r.action} className={`border-b last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/30"}`}>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.priority === "High" ? "bg-rose-100 text-rose-700" :
                      r.priority === "Medium" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"
                    }`}>{r.priority}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">{r.action}</td>
                  <td className="px-5 py-3 text-slate-600">{r.impact}</td>
                  <td className="px-5 py-3 text-slate-600">{r.effort}</td>
                  <td className="px-5 py-3 text-slate-600 font-medium">{r.timeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit economics + recommended pricing */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-3">Unit Economics (USD)</h3>
          <div className="space-y-3">
            {[
              { metric: "Avg Revenue Per Paying User (ARPPU)", value: `$${95}`, note: "Standard tier anchor + upsells push to ~$95" },
              { metric: "Cost to Serve (hosting + Paystack fees)", value: `$${3.50}`, note: "~$0.50 hosting + ~$3.00 fees. Near-zero marginal cost." },
              { metric: "Gross Profit Per Report", value: `$${75.50}`, note: "$79 - $3.50 = 95.6% gross margin" },
              { metric: "CAC (organic — SEO)", value: "$0–$5", note: "~$50/article generates 200+ visits/mo for years." },
              { metric: "CAC (paid — FB/IG)", value: "$15–$30", note: "Diaspora targeting. Varies by creative quality." },
              { metric: "LTV (one-time buyer, current)", value: "$95", note: "Single report + add-ons. No recurring revenue." },
              { metric: "LTV (subscription, proposed)", value: "$228–$588", note: "$19–$49/mo × 12mo × ~50% annual churn" },
              { metric: "Payback Period (organic)", value: "1 day", note: "Report sold before any cost incurred. Negative cash cycle." },
            ].map((m) => (
              <div key={m.metric} className="flex justify-between items-center border-b border-dashed pb-2 last:border-0">
                <div>
                  <div className="text-sm text-slate-700">{m.metric}</div>
                  <div className="text-xs text-slate-400">{m.note}</div>
                </div>
                <div className="text-sm font-bold text-emerald-600 flex-shrink-0 ml-4">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900">Recommended Pricing Structure</h3>
            <div className="flex gap-1 text-[10px]">
              <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Current</span>
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Proposed</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { tier: "Free (Summary)", price: 0, freq: "—", items: "20% of report data, blog access, calculator demo", target: "Funnel top — capture email", tag: "Current" as const },
              { tier: "Starter", price: 19, freq: "/report", items: "1–2 room estimate, basic PDF", target: "Budget-conscious", tag: "Current" as const },
              { tier: "Standard", price: 79, freq: "/report", items: "Full house estimate, regional pricing, PDF + Excel", target: "Diaspora homeowners (sweet spot)", tag: "Current" as const },
              { tier: "Premium", price: 149, freq: "/report", items: "Full report + materials + QS review + 3D viz", target: "Serious builders", tag: "Current" as const },
              { tier: "Monthly Unlimited", price: 19, freq: "/mo", items: "Unlimited basic estimates + all add-ons", target: "Repeat users, contractors", tag: "Proposed" as const },
              { tier: "Annual Unlimited", price: 99, freq: "/yr ($8.25/mo)", items: "Same as monthly — 57% discount vs monthly", target: "Commitment-friendly users", tag: "Proposed" as const },
              { tier: "Team", price: 29, freq: "/mo (5 seats)", items: "Shared dashboard, bulk reports", target: "Architecture firms, agencies", tag: "Proposed" as const },
              { tier: "Enterprise", price: 500, freq: "/mo", items: "API access, white-label, dedicated support", target: "Banks, developers, govt", tag: "Proposed" as const },
            ].map((p) => (
              <div key={p.tier} className={`border rounded-lg p-3 ${p.tag === "Proposed" ? "border-blue-200 bg-blue-50/30" : ""}`}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{p.tier}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      p.tag === "Current" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                    }`}>{p.tag}</span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {p.price === 0 ? "Free" : `${f(p.price)}`}
                    <span className="text-[10px] font-normal text-slate-400 ml-0.5">{p.freq}</span>
                  </span>
                </div>
                <div className="text-xs text-slate-500">{p.items}</div>
                <div className="text-xs text-slate-400 mt-0.5">{p.target}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Prelaunch Checklist ── */
function PrelaunchChecklist() {
  const categories = [
    {
      name: "Infrastructure & Tech",
      items: [
        "Set ADMIN_PASSWORD env var in Vercel",
        "Set PAYSTACK_SECRET_KEY in Vercel",
        "Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY in Vercel",
        "Set RESEND_API_KEY in Vercel",
        "Set UPLOADTHING_SECRET & UPLOADTHING_APP_ID in Vercel",
        "Set OPENAI_API_KEY in Vercel",
        "Verify Neon database connection is stable",
        "Configure Vercel custom domain (buildcostgh.com) — DONE",
        "Verify Cloudflare proxy is working — DONE",
        "Set up Vercel Analytics / monitoring",
        "Configure error tracking (Sentry)",
        "Set up automated database backups",
        "PG-based job queue (SKIP LOCKED) — DONE",
        "Server-side PDF generation (Puppeteer) — DONE",
        "Health check endpoint (/api/health) — DONE",
        "16-region pricing data for all Ghana — DONE",
        "Subscription + Contractor DB models (migrations applied) — DONE",
        "API key tiers (dev/pro/enterprise) with usage tracking — DONE",
      ],
    },
    {
      name: "Security & Compliance",
      items: [
        "Security headers (CSP, HSTS, X-Frame-Options) — DONE",
        "Env var validation at startup — DONE",
        "Generic rate limiter for all public endpoints — DONE",
        "Add auth checks to all admin API routes — DONE",
        "Add auth to file upload endpoint",
        "Rate limiting on admin login — DONE",
        "Privacy Policy page — DONE",
        "Terms of Service page — DONE",
        "Cookie consent banner — DONE",
        "Refund Policy page — DONE",
        "GDPR compliance review",
        "Fix Order.metadata type (String → Json) — DONE",
        "Paystack webhook endpoint (HMAC-signed) — DONE",
        "API auth middleware with tier-based rate limits — DONE",
      ],
    },
    {
      name: "Content & SEO",
      items: [
        "Publish 10+ SEO blog posts before launch",
        "Create sitemap.xml — DONE",
        "Create robots.txt — DONE",
        "Set up Open Graph images for all pages",
        "Write meta descriptions for all pages",
        "Create 'About' page with team story — DONE",
        "Create 'How it Works' explainer page",
        "Create FAQ page addressing diaspora questions",
        "Create 'Pricing' page explaining tiers — DONE",
        "Set up blog RSS feed — DONE",
        "Flood Safe Land lead magnet page — DONE",
        "CSR / Flood Relief page — DONE",
        "Flood risk report page — DONE",
        "API Documentation page (/api-docs) — DONE",
        "API Pricing page (/api-pricing) — DONE",
        "Contractor marketplace listing page — DONE",
        "Contractor detail/profile pages — DONE",
      ],
    },
    {
      name: "Payment & Orders",
      items: [
        "Test Paystack payment flow end-to-end (sandbox)",
        "Paystack webhook for async payment confirmation — DONE",
        "Test email delivery via Resend",
        "Auto-generate PDF report after payment — DONE",
        "Auto-send receipt email after payment — DONE",
        "Test order confirmation flow",
        "Set up invoice/receipt generation",
        "Test refund flow end-to-end",
        "Verify multi-currency pricing (USD + GHS) — DONE",
        "Test payment failure recovery flow",
        "Subscription plans (Monthly $19, Annual $99/yr) — DONE",
        "Subscription toggle on pricing page — DONE",
        "Plan + Subscription DB models + migration — DONE",
      ],
    },
    {
      name: "Autonomous Agents & MCP",
      items: [
        "MCP Server with 10 tools (GET/POST /api/mcp) — DONE",
        "PaymentBot: webhook → PDF → receipt flow — DONE",
        "ReportBot: auto-generate PDF reports — DONE",
        "LeadBot: capture → score → nurture flow — DONE",
        "PriceBot: market data + seasonal factors — DONE",
        "SupportBot: AI-powered assistant (MCP tool) — DONE",
        "Agent activity audit trail (AgentLog model) — DONE",
        "API Key management for MCP auth — DONE",
        "Seasonal factor editor in admin — DONE",
        "Business rules persistence (SiteSetting) — DONE",
        "Command Center admin tab — DONE",
        "Real agent health monitoring — DONE",
        "SSE-based MCP transport (for full protocol compliance)",
        "Connect external AI agents (Claude Desktop, etc.)",
        "OpenAI integration for LLM-powered SupportBot",
        "B2B API v1 endpoint (POST /api/v1/estimate) — DONE",
        "Self-service API key generation (/api/public/keys) — DONE",
        "API authentication library with tier enforcement — DONE",
      ],
    },
    {
      name: "Marketing & Launch",
      items: [
        "Create LAUNCH100 discount code (50% off)",
        "Set up referral program ($5 credit)",
        "Create Twitter/X account for BuildCost.GH",
        "Create LinkedIn company page",
        "Create YouTube channel with demo videos",
        "Write launch announcement blog post",
        "Prepare email launch sequence (3-email drip)",
        "Create list of diaspora Facebook groups to post in",
        "Prepare pitch for Ghana tech media (TechCabal, etc.)",
        "Create product demo video (2-3 min walkthrough)",
        "Pitch Deck admin tab with 12 slides — DONE",
        "Competitive Analysis with 11 competitors — DONE",
        "Academic Research strategy (6 target universities) — DONE",
        "Exit Strategy (4 scenarios, $3M-$500M range) — DONE",
      ],
    },
    {
      name: "Product Experience",
      items: [
        "Test calculator with 10+ different build scenarios",
        "Verify pricing accuracy across all Ghana regions",
        "Mobile responsiveness audit (all screen sizes)",
        "Page load speed optimization (<3s on 3G)",
        "Custom 404 page with helpful navigation — DONE",
        "Add loading states for all data fetches",
        "Add error boundaries for all major pages",
        "Test user dashboard order history",
        "Verify all links across the site work",
        "Test on Safari, Chrome, Firefox, Edge",
        "Exit-intent popup for lead capture — DONE",
        "Blog article CTA (calculator link) — DONE",
        "Pricing urgency banner — DONE",
        "Subscription pricing with monthly/annual toggle — DONE",
        "Contractor listing with search, region, specialty filters — DONE",
        "Calculator location grid with all 16 regions — DONE",
      ],
    },
    {
      name: "Legal & Admin",
      items: [
        "Register BuildCost GH as business name (use Gabochie Design sole proprietorship)",
        "Open GHS business bank account for BuildCost GH",
        "Open USD domiciliary account for diaspora transactions",
        "Connect bank account to Paystack for automated payouts",
        "Register for GRA Tax Identification Number (TIN)",
        "Register for digital services tax with GRA",
        "Set up accounting / bookkeeping system (e.g., Wave, QuickBooks)",
        "Create standard contractor agreement templates",
        "Create client service agreement template",
        "Register trademark for BuildCost GH",
        "Set up WhatsApp Business account for support",
        "Set up business email (hello@buildcostgh.com)",
        "Contractor management UI in admin — DONE",
        "Developer footer links (/api-docs, /api-pricing) — DONE",
        "Contractors in header nav + footer — DONE",
      ],
    },
  ]

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {}
    try {
      const saved = localStorage.getItem("buildcost-prelaunch-checklist")
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  useEffect(() => {
    localStorage.setItem("buildcost-prelaunch-checklist", JSON.stringify(checked))
  }, [checked])

  const allItems = categories.flatMap((c) => c.items)
  const doneCount = allItems.filter((i) => checked[i]).length
  const totalCount = allItems.length
  const pct = Math.round((doneCount / totalCount) * 100)

  const toggle = (item: string) => setChecked((prev) => ({ ...prev, [item]: !prev[item] }))

  return (
    <div className="space-y-6">
      {/* Header with progress */}
      <div className="rounded-2xl border bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Prelaunch Checklist</h2>
            <p className="text-sm text-slate-500">
              Track everything that needs to be done before going live. Progress is saved locally in your browser.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-xl px-5 py-3 shadow-sm border flex-shrink-0">
            <div className="text-center">
              <div className={`text-2xl font-bold ${pct === 100 ? "text-emerald-600" : "text-slate-800"}`}>{pct}%</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wide">Complete</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${pct * 0.967} 96.7`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600">
                {doneCount}/{totalCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick summary cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-3 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Items</div>
          <div className="text-lg font-bold text-slate-800">{totalCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-3 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase">Done</div>
          <div className="text-lg font-bold text-emerald-600">{doneCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-3 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase">Remaining</div>
          <div className={`text-lg font-bold ${totalCount - doneCount === 0 ? "text-emerald-600" : "text-amber-600"}`}>{totalCount - doneCount}</div>
        </div>
        <div className="rounded-xl border bg-white p-3 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-400 uppercase">Status</div>
          <div className={`text-lg font-bold ${pct === 100 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-slate-500"}`}>
            {pct === 100 ? "🎉 Launch Ready" : pct >= 50 ? "In Progress" : "Getting Started"}
          </div>
        </div>
      </div>

      {/* Category progress bar + items */}
      <div className="space-y-5">
        {categories.map((cat) => {
          const catDone = cat.items.filter((i) => checked[i]).length
          const catPct = Math.round((catDone / cat.items.length) * 100)
          return (
            <div key={cat.name} className="rounded-xl border bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-slate-900">{cat.name}</h3>
                  <span className="text-xs text-slate-400">{catDone}/{cat.items.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${
                      catPct === 100 ? "bg-emerald-500" : catPct >= 50 ? "bg-amber-500" : "bg-slate-300"
                    }`} style={{ width: `${catPct}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${
                    catPct === 100 ? "text-emerald-600" : "text-slate-400"
                  }`}>{catPct}%</span>
                </div>
              </div>
              <div className="divide-y">
                {cat.items.map((item) => (
                  <label key={item} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={!!checked[item]}
                      onChange={() => toggle(item)}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={`text-sm flex-1 ${checked[item] ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {item.endsWith("— DONE") ? (
                        <>{item.replace("— DONE", "")} <span className="text-emerald-500 text-xs font-medium">— DONE</span></>
                      ) : item.endsWith("DONE") ? (
                        <>{item} <span className="text-emerald-500 text-xs font-medium">✓</span></>
                      ) : (
                        item
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Pitch Deck ── */
function PitchDeckView() {
  const [slide, setSlide] = useState(0)

  const slides: { title: string; content: React.ReactNode }[] = [
    {
      title: "Title",
      content: (
        <div className="flex flex-col items-center justify-center h-full text-center py-16">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200">
            <span className="text-3xl font-bold text-white">BC</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-3">BuildCost GH</h1>
          <p className="text-xl text-slate-600 max-w-xl">Intelligent Construction Cost Estimation for Ghana &amp; the African Diaspora</p>
          <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Pitch Deck &mdash; Confidential
          </div>
        </div>
      ),
    },
    {
      title: "Problem",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><AlertCircle className="h-5 w-5 text-red-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">The Problem</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: "No Standardised Pricing", desc: "Construction costs in Ghana vary wildly with no centralised data source. Homeowners get wildly different quotes from different contractors." },
              { title: "Diaspora Disconnect", desc: "2M+ Ghanaians abroad send $3.5B+ in remittances yearly. Most want to build but can&apos;t get reliable cost estimates remotely." },
              { title: "Manual & Time-Consuming", desc: "Getting a construction estimate today takes weeks of calling suppliers, contractors, and cross-referencing material prices." },
              { title: "Trust Deficit", desc: "Diaspora investors are frequently overcharged or misled due to lack of transparent, verifiable pricing data." },
            ].map((p) => (
              <div key={p.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-1">{p.title}</h3>
                <p className="text-sm text-slate-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Solution",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Our Solution</h2>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-8 text-white mb-6">
            <p className="text-lg font-medium mb-2">Get an accurate, detailed construction cost estimate in under 5 minutes.</p>
            <p className="text-emerald-100 text-sm">No calls. No site visits. Just data-driven precision.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: "01", title: "Describe Your Project", desc: "Select building type, size, location, and finishes in our intuitive calculator." },
              { step: "02", title: "Get Instant Estimate", desc: "AI-powered engine calculates material, labour, and professional costs in real-time." },
              { step: "03", title: "Download PDF Report", desc: "Receive a comprehensive 10+ page report with full cost breakdown and timeline." },
            ].map((s) => (
              <div key={s.step} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{s.step}</span>
                <h3 className="font-bold text-slate-900 mt-2 mb-1">{s.title}</h3>
                <p className="text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Market Opportunity",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Market Opportunity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "TAM", value: "$8.5B", desc: "Total Addressable Market — Ghana construction estimation annually" },
              { label: "SAM", value: "$1.2B", desc: "Serviceable Addressable Market — diaspora + urban homeowners" },
              { label: "SOM", value: "$48M", desc: "Serviceable Obtainable Market — Year 3 target" },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">{m.value}</div>
                <div className="font-bold text-slate-900">{m.label}</div>
                <div className="text-xs text-slate-500 mt-1">{m.desc}</div>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Key Market Drivers</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                "$3.5B+ annual diaspora remittances to Ghana",
                "2M+ Ghanaians living abroad planning to build",
                "Rapid urbanisation — 57% urban population by 2030",
                "Growing middle class demanding quality housing",
                "Government housing deficit of 1.8M units",
                "No existing automated cost estimation competitor",
              ].map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-slate-700">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Product",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><FileText className="h-5 w-5 text-violet-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Product</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { name: "Starter", price: "GHS 99 ($16)", features: ["5-page summary report", "Basic material cost breakdown", "Email delivery"] },
              { name: "Professional", price: "GHS 249 ($41)", features: ["10-page detailed report", "Material + labour breakdown", "Regional cost comparison", "Excel export"] },
              { name: "Enterprise", price: "GHS 499 ($83)", features: ["15+ page comprehensive report", "Full cost + timeline projection", "Contractor matching", "Priority support", "API access"] },
            ].map((tier, i) => (
              <div key={tier.name} className={`bg-white rounded-xl border-2 p-5 shadow-sm ${i === 1 ? "border-emerald-400 ring-1 ring-emerald-200" : "border-slate-200"}`}>
                {i === 1 && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mb-2 inline-block">Popular</span>}
                <h3 className="font-bold text-slate-900">{tier.name}</h3>
                <p className="text-lg font-bold text-emerald-600 mb-3">{tier.price}</p>
                <ul className="space-y-1.5">
                  {tier.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-1.5 text-sm text-slate-600">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 text-center">Future subscription model: $19/mo basic, $99/yr professional</p>
          <div className="mt-4 bg-gradient-to-r from-violet-50 to-emerald-50 rounded-xl border border-violet-200 p-4">
            <p className="text-sm font-medium text-violet-900 mb-1">AI-Powered</p>
            <p className="text-xs text-violet-700">Natural language project description, AI-assisted cost refinement, and smart material price tracking across all tiers. Enterprise tier includes dedicated AI agent for automated re-estimates.</p>
          </div>
        </div>
      ),
    },
    {
      title: "Business Model",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Business Model</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { title: "Report Sales", desc: "One-time purchase of cost estimation reports ($29–$199 USD)", type: "Current" },
              { title: "Subscriptions", desc: "Monthly/annual plans for repeat users and professionals", type: "Phase 2" },
              { title: "Contractor Marketplace", desc: "Commission on contractor matches &amp; lead generation fees", type: "Phase 3" },
              { title: "API Licensing", desc: "Embed estimates into real estate platforms and banking apps", type: "Phase 4" },
            ].map((r) => (
              <div key={r.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{r.title}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.type === "Current" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{r.type}</span>
                </div>
                <p className="text-sm text-slate-600">{r.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { val: "80%+", label: "Gross Margin" },
              { val: "$19/mo", label: "Subscription (Basic)" },
              { val: "3x", label: "LTV:CAC Target" },
            ].map((m) => (
              <div key={m.label} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <div className="text-xl font-bold text-emerald-600">{m.val}</div>
                <div className="text-xs text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Traction",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Shield className="h-5 w-5 text-emerald-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Traction &amp; Milestones</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { val: "10,000+", label: "Calculations Run" },
              { val: "3", label: "Pricing Tiers" },
              { val: "16", label: "Regions Covered" },
              { val: "50+", label: "Contractor Partners" },
            ].map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center shadow-sm">
                <div className="text-2xl font-bold text-emerald-600">{m.val}</div>
                <div className="text-xs text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Development Progress</h3>
            <div className="space-y-3">
              {[
                { label: "MVP (Calculator + Reports)", pct: 100 },
                { label: "Admin Dashboard &amp; CRM", pct: 100 },
                { label: "Content &amp; SEO Engine", pct: 90 },
                { label: "Payment Integration (Paystack)", pct: 100 },
                { label: "Contractor Marketplace", pct: 15 },
                { label: "Mobile App", pct: 0 },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700">{m.label}</span>
                    <span className="font-medium text-slate-900">{m.pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${m.pct === 100 ? "bg-emerald-500" : m.pct > 50 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${m.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Competition",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center"><Shield className="h-5 w-5 text-red-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Competitive Landscape</h2>
          </div>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-emerald-600 bg-emerald-50/50">BuildCost GH</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Freelance QS</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">DIY Excel</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-600">Global Tools</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Instant estimate", "✅", "❌", "❌", "✅"],
                  ["Ghana-specific data", "✅", "✅", "✅", "❌"],
                  ["PDF report", "✅", "✅", "❌", "✅"],
                  ["Diaspora-friendly", "✅", "❌", "❌", "❌"],
                  ["Price (per report)", "$16–$83", "$500–$2,000", "Free (time)", "$50–$200"],
                  ["Accuracy", "98%", "95%+", "Varies", "Varies"],
                  ["AI-powered", "✅", "❌", "❌", "Partial"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {row.map((cell, j) => (
                      <td key={j} className={`py-2.5 px-4 ${j === 0 ? "font-medium text-slate-900 text-left" : "text-center"} ${j === 1 ? "bg-emerald-50/50 font-medium" : ""}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <p className="text-sm text-emerald-800 font-medium">Key Differentiator: BuildCost GH is the only platform combining instant estimates, Ghana-specific local pricing, diaspora-friendly experience, AI-powered cost intelligence, and professional PDF reports at an accessible price point.</p>
          </div>
        </div>
      ),
    },
    {
      title: "AI & Agentic Strategy",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-violet-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">AI &amp; Agentic Strategy</h2>
          </div>
          <div className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl p-6 text-white mb-6">
            <p className="text-lg font-medium mb-1">First autonomous construction cost intelligence platform in Africa</p>
            <p className="text-sm text-violet-200">Multi-agent system: PriceBot, EstimateBot, ContractorMatch, FinanceBot</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { phase: "Phase 1 (Now–3mo)", title: "AI-Assisted", items: ["AI material price suggestions", "Smart location cost adjustments", "Natural language estimate refinement", "Automated PDF generation"] },
              { phase: "Phase 2 (3–9mo)", title: "Agentic Workflows", items: ["PriceBot: real-time supplier monitoring", "EstimateBot: NL project → estimate", "ContractorMatch: auto contractor matching", "EmailBot: automated engagement"] },
              { phase: "Phase 3 (9–18mo)", title: "Autonomous Platform", items: ["Multi-agent orchestration with memory", "Auto-quoting for contractors", "Predictive cost trend analytics", "API agents for third-party embed"] },
            ].map((p) => (
              <div key={p.phase} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">{p.phase}</span>
                <h3 className="font-bold text-slate-900 mt-2 mb-2">{p.title}</h3>
                <ul className="space-y-1">
                  {p.items.map((item, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <CheckCircle className="h-3 w-3 text-emerald-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            {[
              { val: "70%", label: "Auto-estimate target" },
              { val: "&lt; 2min", label: "AI completion time" },
              { val: "±5%", label: "Accuracy vs QS" },
              { val: "24hr", label: "Price data freshness" },
            ].map((m) => (
              <div key={m.label} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                <div className="text-lg font-bold text-violet-600">{m.val}</div>
                <div className="text-xs text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Marketing & Growth",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Marketing &amp; Growth Strategy</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { title: "SEO Content Engine", desc: "Blog posts targeting &apos;cost to build in Ghana&apos;, &apos;house construction cost Accra&apos; and 200+ long-tail keywords. Estimated 50K monthly organic visitors by month 12." },
              { title: "Diaspora Communities", desc: "Active presence in Ghanaian diaspora Facebook groups, WhatsApp communities, and UK/US associations. Referral program for community leaders." },
              { title: "Social Media", desc: "YouTube walkthroughs of cost estimates, TikTok/Instagram Reels showing before/after costs, Twitter thought leadership on Ghana construction." },
              { title: "Partnerships", desc: "Real estate agents, architecture firms, and diaspora-focused financial services integrating our estimate widget. Revenue share model." },
            ].map((c) => (
              <div key={c.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-1">{c.title}</h3>
                <p className="text-sm text-slate-600">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-5 text-white">
            <div className="text-sm font-medium text-blue-200">Channel Mix Target (Year 1)</div>
            <div className="grid grid-cols-4 gap-4 mt-3 text-center">
              {[
                { ch: "Organic Search", pct: "40%" },
                { ch: "Social/Community", pct: "25%" },
                { ch: "Referral", pct: "20%" },
                { ch: "Paid/Partnership", pct: "15%" },
              ].map((c) => (
                <div key={c.ch}>
                  <div className="text-xl font-bold">{c.pct}</div>
                  <div className="text-xs text-blue-200">{c.ch}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Team",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><Users className="h-5 w-5 text-violet-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Team</h2>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">GA</div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Gideon B. Abochie</h3>
                <p className="text-sm text-slate-500">Founder &amp; Developer</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-4">Full-stack developer with deep understanding of the Ghanaian construction market and diaspora investment landscape. Built the entire platform from concept to deployment.</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-3">Advisors &amp; Support Network</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
              {["Ghanaian construction professionals", "Diaspora real estate investors", "Tech startup mentors", "Legal &amp; financial advisors"].map((a, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-3">
                  <div className="text-slate-900 font-medium">{a}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Financial Projections",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">Financial Projections</h2>
          </div>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Metric</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Year 1</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Year 2</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Year 3</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Paid Users", "1,200", "6,000", "18,000"],
                  ["Revenue", "$310K", "$1.8M", "$7.2M"],
                  ["Gross Margin", "78%", "82%", "85%"],
                  ["Operating Expenses", "$280K", "$1.1M", "$3.6M"],
                  ["Net Income", "$30K", "$700K", "$3.6M"],
                  ["ARPU", "$23", "$32", "$40"],
                  ["AI Agent Revenue", "$0", "$180K", "$1.4M"],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{row[0]}</td>
                    {row.slice(1).map((cell, j) => (
                      <td key={j} className={`py-2.5 px-4 text-right ${j === row.length - 2 ? "text-emerald-600 font-bold" : "text-slate-700"}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Revenue Mix (Year 3)", items: ["Report sales: 40%", "Subscriptions: 35%", "Marketplace: 20%", "API: 5%"] },
              { label: "Key Assumptions", items: ["2% conversion rate (visitor → paid)", "3x year-over-year growth", "80%+ gross margin from Year 1", "$15K/mo fixed costs (Year 1)"] },
              { label: "Funding Required", items: ["Pre-seed: $50K–$100K", "Seed (Month 12): $300K–$500K", "Series A (Month 24): $1M–$2M"] },
            ].map((c) => (
              <div key={c.label} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-900 text-sm mb-2">{c.label}</h3>
                <ul className="space-y-1">
                  {c.items.map((item, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5"><CheckCircle className="h-3 w-3 text-emerald-600 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Ask",
      content: (
        <div className="py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
            <h2 className="text-2xl font-heading font-bold text-slate-900">The Ask</h2>
          </div>
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-2xl p-8 text-white text-center mb-6">
            <p className="text-3xl font-bold mb-2">$50,000 – $100,000</p>
            <p className="text-amber-100">Pre-Seed Round &mdash; Equity or Convertible Note</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { title: "Product Development", pct: "35%", items: ["Mobile app (React Native)", "AI cost prediction engine", "Contractor marketplace MVP", "Real-time material pricing"] },
              { title: "Marketing & Growth", pct: "30%", items: ["SEO content production", "Diaspora community outreach", "Paid acquisition testing", "Partnership development"] },
              { title: "Operations & Team", pct: "20%", items: ["Part-time content writer", "Customer support", "Legal & accounting", "Office/admin"] },
              { title: "Reserve", pct: "15%", items: ["6-month runway buffer", "Infrastructure costs", "Contingency fund"] },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900">{f.title}</h3>
                  <span className="text-lg font-bold text-emerald-600">{f.pct}</span>
                </div>
                <ul className="space-y-1">
                  {f.items.map((item, i) => (
                    <li key={i} className="text-sm text-slate-600 flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 text-center">
            <p className="text-sm text-slate-600">Contact us at <a href="mailto:investors@buildcostgh.com" className="text-emerald-600 font-medium hover:underline">investors@buildcostgh.com</a> for more information.</p>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <style>{`
        @media print {
          body > * { display: none !important; }
          .pitch-deck-print { display: block !important; }
          .pitch-deck-print, .pitch-deck-print * { visibility: visible; }
          .pitch-deck-print { position: absolute; left: 0; top: 0; width: 100%; }
          .pitch-deck-print .slide-card { break-inside: avoid; page-break-after: always; box-shadow: none !important; border: 1px solid #e2e8f0 !important; margin: 0 0 1cm 0; }
          @page { size: landscape; margin: 1.5cm; }
        }
      `}</style>

      {/* Controls */}
      <div className="no-print flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">Investor Pitch Deck</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{slides.length} slides</span>
        </div>
        <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
        </Button>
      </div>

      {/* Slide navigation */}
      <div className="no-print flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {slides.map((s, i) => (
          <button key={i} onClick={() => setSlide(i)} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            i === slide ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}>
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      {/* Current slide */}
      <div className="slide-card bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 min-h-[400px] mb-6">
        <div className="flex items-center justify-between mb-4 no-print text-xs text-slate-400">
          <span>Slide {slide + 1} of {slides.length}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0} className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium">Prev</button>
            <button onClick={() => setSlide(Math.min(slides.length - 1, slide + 1))} disabled={slide === slides.length - 1} className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium">Next</button>
          </div>
        </div>
        {slides[slide].content}
      </div>

      {/* Print view (hidden on screen) */}
      <div className="pitch-deck-print" style={{ display: "none" }}>
        {slides.map((s, i) => (
          <div key={i} className="slide-card bg-white rounded-2xl border border-slate-200 p-10 min-h-[400px] mb-6">
            <div className="text-xs text-slate-400 mb-2">Slide {i + 1} of {slides.length}</div>
            {s.content}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Competitive Analysis ── */
function CompetitiveAnalysisView() {
  const [section, setSection] = useState("overview")

  const competitors = [
    {
      name: "ExactoCost",
      url: "exactocost.com",
      tagline: "BOQ & construction cost estimation software for QS professionals — SMM7/NRM2, live Ghana supplier rates",
      tier: "Direct",
      founders: "David Odoi",
      backed: "Self-funded",
      launched: "2025/2026",
      focus: "Professional QS & Construction Firms (B2B)",
      pricing: "Student free · Professional GHS 150/mo · Firm GHS 400/mo",
      strengths: [
        "SMM7/NRM2-compliant BOQ workflows — real professional QS credibility",
        "Transparent live rate database published publicly (cement GHS 101/bag, rebar GHS 9,800/t, NPA diesel GHS 16.10/L, plant hire)",
        "Distance-banded haulage built into unit rates, not bolted on",
        "Free academic tier for students & lecturers — captures the next generation of QS professionals",
        "AEO-savvy: llms.txt with hard rate data + AI crawlers explicitly allowed",
        "Subscription pricing (GHS 150–400/mo) = strong recurring revenue per customer",
      ],
      weaknesses: [
        "Only 4 regions covered (Greater Accra, Ashanti, Western, Northern) — BuildCost GH covers all 16",
        "B2B/QS-only — no self-serve homeowner or diaspora market (the mass market)",
        "High price + GHS 2.00 card verification = high friction vs our free calculator",
        "No contractor directory, no flood-risk data, no diaspora angle",
        "Blog is 8 posts from a single April–May 2026 burst — content gap we can exploit",
        "GHS-only pricing — no multi-currency for diaspora",
      ],
      threat: "High",
    },
    {
      name: "GhanaHousePlanner",
      url: "ghanahouseplanner.com",
      tagline: "Free cost calculator + AI floor plans + project management",
      tier: "Direct",
      founders: "Emmanuel Apaaboah & Bernard Opoku",
      backed: "UCC & KNUST Research",
      launched: "2025/2026",
      focus: "Consumer & Diaspora",
      pricing: "Free + Pro/Starter",
      strengths: ["Research-backed pricing (±5-10%)", "16-region coverage", "AI floor plan agent", "Project management tools", "BIM export (IFC/DXF/GLTF)", "CornerStore material sourcing", "Strong diaspora features"],
      weaknesses: ["Newer platform, limited traction", "No payment integration for reports", "Free tier limits depth", "No contractor marketplace yet"],
      threat: "High",
    },
    {
      name: "CostmyBuild",
      url: "costmybuild.com",
      tagline: "Cost estimator + verified vendors + escrow payments",
      tier: "Direct",
      founders: "Henry Engmann",
      backed: "Self-funded",
      launched: "2025/2026",
      focus: "Consumer & Diaspora",
      pricing: "Free estimate + vendor fees",
      strengths: ["100+ verified contractors", "Live material price guide", "Secure escrow payments", "Diaspora-first positioning", "Mobile-friendly"],
      weaknesses: ["Ghana-only (launching)", "Platform commission model unclear", "No AI estimation reported", "Limited regional coverage data"],
      threat: "High",
    },
    {
      name: "BaniEstimations",
      url: "baniestimations.com",
      tagline: "Professional QS software for engineers",
      tier: "Indirect - Professional",
      founders: "N/A",
      backed: "Self-funded",
      launched: "Est. 2015",
      focus: "Professional Engineers & QS",
      pricing: "Paid software license",
      strengths: ["Established since 2015", "Deep professional features (BOQ, valuations, IPCs)", "Localized for Ghana", "Project management tools"],
      weaknesses: ["Desktop software (not SaaS)", "Professional-only audience", "No consumer calculator", "No diaspora features", "No AI capabilities visible"],
      threat: "Low",
    },
    {
      name: "ToSi",
      url: "tosiapp.com",
      tagline: "Ghana's premier construction app",
      tier: "Direct",
      founders: "N/A",
      backed: "N/A",
      launched: "2025/2026",
      focus: "Consumer & Contractors",
      pricing: "Free 30-day trial",
      strengths: ["Material price locking feature", "'Buy bit by bit' approach", "Marketplace for materials/services", "Mobile-first (iOS + Android)", "Phase-based project tracking", "Surplus material resale"],
      weaknesses: ["Savings-focused (not estimation-first)", "No AI estimation", "New platform, limited track record", "Diaspora features unclear"],
      threat: "Medium",
    },
    {
      name: "Backrow Calculator",
      url: "backrowcalc.com",
      tagline: "Ghana construction cost calculator",
      tier: "Direct",
      founders: "N/A",
      backed: "N/A",
      launched: "2025/2026",
      focus: "Consumer",
      pricing: "Free summary, £3.99 detailed",
      strengths: ["Simple, fast calculator", "Multi-currency (GHS, GBP, EUR, USD)", "Monthly price updates", "Labour cost toggle", "Material brand options"],
      weaknesses: ["Very basic feature set", "No diaspora features", "No project management", "No contractor network", "Low brand visibility"],
      threat: "Low",
    },
    {
      name: "HomeAccess",
      url: "homeaccessgh.com",
      tagline: "All-in-one construction platform",
      tier: "Direct",
      founders: "N/A",
      backed: "N/A",
      launched: "N/A",
      focus: "Consumer",
      pricing: "Report-based fees",
      strengths: ["Business reports (build, complete, buy land)", "Material purchasing from suppliers", "Financing solutions", "Free house designs with 3D", "Cost tracking & budgeting"],
      weaknesses: ["No instant calculator (report-based)", "No AI features", "Less modern UI/UX", "Diaspora features unclear"],
      threat: "Medium",
    },
    {
      name: "Genuine Stuffs",
      url: "GitHub (open source)",
      tagline: "Africa's first AI-native construction OS",
      tier: "Pan-African",
      founders: "N/A",
      backed: "Open source",
      launched: "2025",
      focus: "Professional & Enterprise",
      pricing: "Credits-based (2 credits/run)",
      strengths: ["AI-native BoQ generation from design brief", "Live material procurement", "Paystack integration", "Credits billing model", "Technical calculators (concrete, steel)"],
      weaknesses: ["GitHub project (early stage)", "No consumer-facing product", "No diaspora features", "Ghana pricing data unclear"],
      threat: "Medium",
    },
    {
      name: "Fara",
      url: "farahq.com",
      tagline: "AI cost estimation + project finance",
      tier: "Pan-African",
      founders: "N/A",
      backed: "N/A",
      launched: "2025/2026",
      focus: "Diaspora & Developers",
      pricing: "Platform fee",
      strengths: ["AI estimation from floor plans", "Project wallets & vendor payouts", "Multi-currency support", "Budget vs actual tracking", "Strong diaspora positioning"],
      weaknesses: ["Finance-focused (not estimation-first)", "Newer platform", "Limited regional coverage data", "No consumer calculator"],
      threat: "Medium",
    },
    {
      name: "DiasporaBuild",
      url: "diasporabuild.com",
      tagline: "Build in Africa with confidence",
      tier: "Pan-African",
      founders: "N/A",
      backed: "N/A",
      launched: "2025/2026",
      focus: "Diaspora",
      pricing: "0% commission (launch), then % fee",
      strengths: ["500+ diaspora families", "Milestone-based payments", "AI assistant (DIBO)", "Verified contractor marketplace", "Real-time photo/video tracking", "Multi-country (Cameroon, Nigeria, Ghana, Kenya)"],
      weaknesses: ["Not estimation-focused", "Platform commission after launch", "Newer to market", "Broker model (not DIY estimation)"],
      threat: "High",
    },
    {
      name: "TrueBuild",
      url: "mytruebuild.com",
      tagline: "Construction management for diaspora",
      tier: "Pan-African",
      founders: "N/A",
      backed: "N/A",
      launched: "2025/2026",
      focus: "Diaspora",
      pricing: "$150/site audit",
      strengths: ["Professional site audits with GPS photos", "Vetted skilled labour", "Independent inspectors (no conflict)", "Detailed workmanship reports", "Diaspora-first"],
      weaknesses: ["Service-based (not software)", "High per-audit cost", "No estimation calculator", "Ghana-only currently"],
      threat: "Low",
    },
    {
      name: "AfroTools",
      url: "afrotools.com",
      tagline: "Pan-African BOQ & construction tools",
      tier: "Pan-African",
      founders: "N/A",
      backed: "N/A",
      launched: "2025/2026",
      focus: "Consumer & Professional",
      pricing: "Free tools",
      strengths: ["15+ African countries", "60+ material items", "Local pricing per country", "CSV export / print", "Multiple free tools"],
      weaknesses: ["No AI capabilities", "Basic feature set", "No diaspora features", "No payment integration"],
      threat: "Low",
    },
  ]

  const matrixFeatures = [
    { feature: "Instant cost estimate", bc: true, ghp: true, cmb: true, ban: true, tosi: false, brc: true, ha: false, exc: true },
    { feature: "Ghana-specific pricing", bc: true, ghp: true, cmb: true, ban: true, tosi: true, brc: true, ha: true, exc: true },
    { feature: "16-region coverage", bc: true, ghp: true, cmb: false, ban: false, tosi: false, brc: false, ha: false, exc: false },
    { feature: "AI-powered estimation", bc: true, ghp: "Partial", cmb: false, ban: false, tosi: false, brc: false, ha: false, exc: false },
    { feature: "Multi-currency support", bc: true, ghp: false, cmb: false, ban: false, tosi: false, brc: true, ha: false, exc: false },
    { feature: "PDF report download", bc: true, ghp: true, cmb: false, ban: true, tosi: false, brc: true, ha: true, exc: false },
    { feature: "BOQ / Excel export", bc: false, ghp: false, cmb: false, ban: true, tosi: false, brc: false, ha: false, exc: true },
    { feature: "SMM7 / NRM2 measurement", bc: false, ghp: false, cmb: false, ban: true, tosi: false, brc: false, ha: false, exc: true },
    { feature: "Diaspora-first features", bc: true, ghp: true, cmb: true, ban: false, tosi: false, brc: false, ha: false, exc: false },
    { feature: "Contractor marketplace", bc: false, ghp: false, cmb: true, ban: false, tosi: true, brc: false, ha: false, exc: false },
    { feature: "Material price tracking", bc: false, ghp: "CornerStore", cmb: true, ban: false, tosi: true, brc: false, ha: true, exc: true },
    { feature: "Project management", bc: false, ghp: true, cmb: false, ban: true, tosi: true, brc: false, ha: true, exc: true },
    { feature: "Payment integration", bc: "Paystack", ghp: false, cmb: "Escrow", ban: false, tosi: false, brc: "Stripe", ha: false, exc: "Paystack" },
    { feature: "Agentic/AI workflows", bc: true, ghp: "AI Agent", cmb: false, ban: false, tosi: false, brc: false, ha: false, exc: false },
    { feature: "Mobile app", bc: false, ghp: false, cmb: false, ban: false, tosi: true, brc: false, ha: false, exc: false },
    { feature: "Free tier available", bc: false, ghp: true, cmb: true, ban: false, tosi: true, brc: true, ha: true, exc: "Students" },
  ]

  const sections = [
    { id: "overview", label: "Market Overview" },
    { id: "profiles", label: "Competitor Profiles" },
    { id: "matrix", label: "Feature Matrix" },
    { id: "swot", label: "SWOT Analysis" },
    { id: "strategy", label: "Monopoly Strategy" },
    { id: "recommendations", label: "Recommendations" },
  ]

  const now = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const shortName = (n: string) => n === "GhanaHousePlanner" ? "ghp" : n === "CostmyBuild" ? "cmb" : n === "BaniEstimations" ? "ban" : n === "Backrow Calculator" ? "brc" : n === "HomeAccess" ? "ha" : n === "ToSi" ? "tosi" : ""

  return (
    <div>
      {/* Section nav */}
      <div className="no-print flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)} className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
            section === s.id ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}>
            {s.label}
          </button>
        ))}
        <div className="flex-1" />
        <span className="text-xs text-slate-400">Last researched: {now}</span>
      </div>

      {section === "overview" && (
        <div className="space-y-6">
          {/* Hero stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { val: "12", label: "Competitors Identified", icon: Crosshair, color: "from-red-500 to-red-600" },
              { val: "8", label: "Direct (Ghana)", icon: Target, color: "from-amber-500 to-amber-600" },
              { val: "4", label: "Pan-African", icon: Globe, color: "from-blue-500 to-blue-600" },
              { val: "4", label: "High Threat", icon: Zap, color: "from-red-600 to-red-700" },
            ].map((s) => (
              <div key={s.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.color} p-5 text-white shadow-lg`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white/80">{s.label}</p>
                    <s.icon className="h-5 w-5 text-white/60" />
                  </div>
                  <p className="text-3xl font-bold">{s.val}</p>
                </div>
                <div className="absolute -bottom-3 -right-3 w-24 h-24 rounded-full bg-white/5" />
              </div>
            ))}
          </div>

          {/* Market summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-3">Market Landscape Summary</h3>
            <p className="text-sm text-slate-600 mb-4">The Ghana construction estimation market is rapidly evolving with 12+ identified platforms. The market splits into three tiers:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                <h4 className="font-bold text-red-800 text-sm mb-2">High Threat</h4>
                <p className="text-xs text-red-700">ExactoCost, GhanaHousePlanner, CostmyBuild, DiasporaBuild</p>
                <p className="text-xs text-red-600 mt-1">ExactoCost owns the professional QS/BOQ segment; GhanaHousePlanner, CostmyBuild, and DiasporaBuild overlap BuildCost GH&apos;s consumer/diaspora market. All are gaining traction.</p>
              </div>
              <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
                <h4 className="font-bold text-amber-800 text-sm mb-2">Medium Threat</h4>
                <p className="text-xs text-amber-700">ToSi, HomeAccess, Genuine Stuffs, Fara</p>
                <p className="text-xs text-amber-600 mt-1">Adjacent platforms that could expand into estimation. Monitor for feature overlap and market expansion.</p>
              </div>
              <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                <h4 className="font-bold text-emerald-800 text-sm mb-2">Low Threat</h4>
                <p className="text-xs text-emerald-700">BaniEstimations, Backrow, TrueBuild, AfroTools</p>
                <p className="text-xs text-emerald-600 mt-1">Niche or non-overlapping. Professional-only (BaniEstimations), basic tools (Backrow, AfroTools), or service-based (TrueBuild).</p>
              </div>
            </div>
          </div>

          {/* Key insights */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Key Market Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "No single platform dominates — the market is fragmented with early-stage players, creating a window of opportunity",
                "ExactoCost is the primary PROFESSIONAL threat: B2B BOQ software (SMM7/NRM2) with transparent live supplier rates and a free academic tier — but only 4 regions and zero homeowner/diaspora self-serve",
                "ExactoCost is AEO-savvy (llms.txt with hard rate data, AI crawlers allowed) — we must counter by publishing our own 16-region public rate database",
                "GhanaHousePlanner is the closest direct consumer competitor with research-backed pricing and strong diaspora features",
                "Only BuildCost GH and Backrow Calculator offer multi-currency options (USD/GHS/GBP/EUR)",
                "AI-powered estimation is still nascent — only GhanaHousePlanner (AI Agent) and Genuine Stuffs (AI BoQ) have it",
                "Most competitors lack a paid report model — BuildCost GH's per-report revenue is unique in the market",
                "Diaspora-focused platforms (DiasporaBuild, TrueBuild, Fara) are service/broker models, not DIY estimation",
                "No competitor offers agentic workflows (multi-agent systems) — this is a first-mover advantage",
                "Material price locking (ToSi) and escrow payments (CostmyBuild) are emerging features to monitor",
              ].map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                  <Lightbulb className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  {insight}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === "profiles" && (
        <div className="space-y-4">
          {competitors.map((c) => (
            <div key={c.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className={`px-6 py-3 flex items-center justify-between ${c.threat === "High" ? "bg-red-50 border-b border-red-200" : c.threat === "Medium" ? "bg-amber-50 border-b border-amber-200" : "bg-slate-50 border-b border-slate-200"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                    c.threat === "High" ? "bg-red-500" : c.threat === "Medium" ? "bg-amber-500" : "bg-slate-500"
                  }`}>
                    {c.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{c.name}</h3>
                    <p className="text-xs text-slate-500">{c.tagline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    c.tier === "Direct" ? "bg-red-100 text-red-700" : c.tier.startsWith("Pan") ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                  }`}>{c.tier}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    c.threat === "High" ? "bg-red-100 text-red-700" : c.threat === "Medium" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}>{c.threat} Threat</span>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Details</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-slate-500">URL:</span> <a href={`https://${c.url}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{c.url}</a></div>
                    {c.founders !== "N/A" && <div><span className="text-slate-500">Founders:</span> <span className="text-slate-900">{c.founders}</span></div>}
                    {c.backed !== "N/A" && <div><span className="text-slate-500">Backing:</span> <span className="text-slate-900">{c.backed}</span></div>}
                    <div><span className="text-slate-500">Focus:</span> <span className="text-slate-900">{c.focus}</span></div>
                    <div><span className="text-slate-500">Pricing:</span> <span className="text-slate-900">{c.pricing}</span></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Strengths</p>
                  <ul className="space-y-1">
                    {c.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold mb-2">Weaknesses</p>
                  <ul className="space-y-1">
                    {c.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600">
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {section === "matrix" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Feature Comparison Matrix</h3>
            <p className="text-xs text-slate-400 mt-1">BuildCost GH vs Ghana-focused competitors</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-900 min-w-[160px]">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-emerald-600 bg-emerald-50/50 min-w-[100px]">BuildCost GH</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 min-w-[100px]">GhanaHouse Planner</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 min-w-[100px]">CostmyBuild</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 min-w-[100px]">ExactoCost</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 min-w-[100px]">BaniEstimations</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 min-w-[100px]">ToSi</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 min-w-[100px]">Backrow Calc</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700 min-w-[100px]">HomeAccess</th>
                </tr>
              </thead>
              <tbody>
                {matrixFeatures.map((row, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 font-medium text-slate-900">{row.feature}</td>
                    {["bc", "ghp", "cmb", "exc", "ban", "tosi", "brc", "ha"].map((key) => {
                      const val = row[key as keyof typeof row]
                      const isBc = key === "bc"
                      return (
                        <td key={key} className={`py-2.5 px-4 text-center text-xs ${isBc ? "bg-emerald-50/50 font-medium" : ""}`}>
                          {val === true ? <CheckCircle className="h-4 w-4 text-emerald-600 mx-auto" /> : val === false ? <span className="text-slate-300">—</span> : <span className="text-amber-600 font-medium">{val}</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {section === "swot" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Award className="h-5 w-5 text-emerald-700" />
                <h3 className="font-bold text-emerald-900">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {[
                  "Only platform with per-report paid model ($16–$83) — proven revenue from day one",
                  "Multi-currency support (USD/GHS) with real-time Frankfurter API exchange rates",
                  "3 estimation methods (All-in, Room-by-Room, Materials) — most flexible input",
                  "Paystack payment integration for Ghanaian & diaspora users",
                  "AI/Agentic strategy in pipeline — no competitor has multi-agent workflows",
                  "Comprehensive admin dashboard with CRM, blog, orders, and analytics",
                  "Built on modern stack (Next.js 15, TypeScript, PostgreSQL) — scalable",
                ].map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-emerald-800">
                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-red-700" />
                <h3 className="font-bold text-red-900">Weaknesses</h3>
              </div>
              <ul className="space-y-2">
                {[
                  "No mobile app — competitors like ToSi have iOS/Android",
                  "No contractor marketplace yet — CostmyBuild and ToSi have this live",
                  "Limited regional pricing data — GhanaHousePlanner covers all 16 regions",
                  "No free tier — most competitors offer free basic estimates",
                  "No project management tools for ongoing builds",
                  "Subscription model not yet implemented (currently only one-time reports)",
                  "Smaller brand presence vs established competitors",
                ].map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-blue-700" />
                <h3 className="font-bold text-blue-900">Opportunities</h3>
              </div>
              <ul className="space-y-2">
                {[
                  "First-mover in AI/agentic workflows for Ghana construction estimation",
                  "ExactoCost only covers 4 regions and ignores the homeowner/diaspora market — publish 16-region public rate pages to counter their transparency moat and own the SEO/AEO surface",
                  "Professional BOQ/Excel export at one-time prices (GHS 249 vs their GHS 150/mo) lets us win QS customers on price",
                  "Free academic tier for Ghanaian universities intercepts students before they default to ExactoCost",
                  "Diaspora market is underserved — $3.5B+ remittances, few platforms cater specifically to diaspora needs",
                  "No competitor offers both estimation AND contractor marketplace — BuildCost GH can bridge this",
                  "Corporate/B2B API licensing — no competitor offers embeddable estimates for real estate platforms/banks",
                  "Subscription revenue model is unproven in this market — opportunity to set the standard",
                  "Expand to Nigeria, Kenya, and other African markets where AfroTools shows demand but no dominant player exists",
                  "Mobile app + agentic AI could be a powerful combination no competitor has yet",
                ].map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-800">
                    <Target className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-amber-700" />
                <h3 className="font-bold text-amber-900">Threats</h3>
              </div>
              <ul className="space-y-2">
                {[
                  "ExactoCost owns the professional QS segment (SMM7/NRM2, live supplier rates) and captures students for free — if they expand to the consumer market they become formidable",
                  "ExactoCost publishes transparent rate data publicly — if we don't publish our 16-region data, their transparency claim wins credibility with AI engines and professional buyers",
                  "GhanaHousePlanner has research validation (UCC/KNUST) — BuildCost GH lacks academic backing",
                  "CostmyBuild already has 100+ verified contractors — hard to catch up in marketplace",
                  "DiasporaBuild has 500+ diaspora families and multi-country presence",
                  "ToSi's material price locking is an innovative feature BuildCost GH doesn't offer",
                  "New competitors emerging rapidly — first-mover advantage window is closing",
                  "Well-funded pan-African platforms (Fara, DiasporaBuild) could expand into estimation",
                  "Global tools (BuildZoom, Planner 5D) may add Ghana-specific data over time",
                ].map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <Zap className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {section === "strategy" && (
        <div className="space-y-6">
          {/* Thesis */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Crosshair className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-lg">The Monopoly Thesis</h3>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Win the demand surface, then win the supply side. Every Ghanaians and diaspora member who wants to build is a buyer;
              every contractor is a supplier. ExactoCost only serves a narrow slice of the middle (QS professionals). BuildCost GH
              owns the funnel that feeds everyone: free estimate &rarr; paid report &rarr; contractor match. Whoever owns that funnel owns the market.
            </p>
          </div>

          {/* Attack surface */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">ExactoCost — Attack Surface (their weaknesses, our weapons)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Globe, title: "4 regions vs our 16", desc: "They pitch 'Tamale projects don't get Accra rates' — but they have no Tamale rates. Publish per-region cost pages for all 16 regions. That destroys their only real moat.", color: "text-blue-600 bg-blue-50" },
                { icon: Target, title: "B2B-only, no mass market", desc: "They chase a few thousand QSs. Every homeowner + diaspora investor who wants a house price is a BuildCost customer. Free calculator = land-grab weapon; they can't give a BOQ tool away to a homeowner.", color: "text-emerald-600 bg-emerald-50" },
                { icon: Building2, title: "No ecosystem", desc: "No contractor directory, no flood-risk data, no diaspora angle, no API, no voice. We have all five. Bundle them so switching to a point-solution is pointless.", color: "text-violet-600 bg-violet-50" },
                { icon: Zap, title: "High friction + price", desc: "Card verification (GHS 2.00) + GHS 150/mo kills impulse conversion. Our free instant estimate + one-time GHS 99 report + mobile money is 10x friendlier for the mass market.", color: "text-amber-600 bg-amber-50" },
                { icon: Award, title: "Content volume gap", desc: "They published 8 posts in a 3-week burst (Apr-May 2026). We have 50+ with diaspora and flood depth. Win every keyword: consumer + QS terms, plus AI answer engines.", color: "text-red-600 bg-red-50" },
              ].map((a) => (
                <div key={a.title} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${a.color.split(" ")[1]}`}>
                    <a.icon className={`h-4 w-4 ${a.color.split(" ")[0]}`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{a.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Phases */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">The 4-Phase Execution Plan</h3>
            <div className="space-y-4">
              {[
                {
                  phase: "Phase 1 — Land-grab the free surface",
                  timeline: "This week",
                  color: "bg-emerald-600",
                  items: [
                    "Publish 16 regional cost pages with live rate tables + FAQ/JSON-LD (they have 4 — beat them on coverage)",
                    "Launch a public Ghana rate database page (mirror their transparency play, but 16 regions, monthly updates)",
                    "Keep the free calculator frictionless — no signup, no card, mobile money at checkout",
                  ],
                },
                {
                  phase: "Phase 2 — Win the professional segment",
                  timeline: "Next 2-4 weeks",
                  color: "bg-blue-600",
                  items: [
                    "Add BOQ/Excel export + measurement-grade line items to Detailed/Premium reports (GHS 249 once vs their GHS 150/mo)",
                    "Launch free academic tier for Ghanaian universities — intercept students before they pick ExactoCost",
                    "Publish an SMM7/NRM2 alignment note to win QS credibility",
                  ],
                },
                {
                  phase: "Phase 3 — SEO & AEO dominance",
                  timeline: "Ongoing",
                  color: "bg-violet-600",
                  items: [
                    "Target every keyword they rank for (BOQ tool Ghana, how to prepare BOQ in Ghana) PLUS all homeowner/diaspora keywords",
                    "Keep llms.txt fresh with hard rate data and keep AI crawlers open (already done)",
                    "Weekly content cadence: 2 posts/week covering rate data, region guides, cost guides",
                  ],
                },
                {
                  phase: "Phase 4 — Ecosystem moat",
                  timeline: "This quarter",
                  color: "bg-amber-600",
                  items: [
                    "Bundle contractor directory + flood-risk + API + voice into every paid report",
                    "Two-sided network effects: contractors pay to be listed where homeowners already estimate",
                    "Open the estimation API to banks, real-estate portals, and remittance platforms",
                  ],
                },
              ].map((p) => (
                <div key={p.phase} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className={`${p.color} px-5 py-3 flex items-center justify-between text-white`}>
                    <h4 className="font-bold text-sm">{p.phase}</h4>
                    <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-medium">{p.timeline}</span>
                  </div>
                  <ul className="p-5 space-y-2">
                    {p.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* First strike */}
          <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5" />
              <h3 className="font-bold">First Strike (do now)</h3>
            </div>
            <p className="text-sm text-red-100 leading-relaxed">
              Build the 16-region cost data pages and the public rate database. It&apos;s our data, their weakness, and it single-handedly
              counters their transparency moat while owning the SEO/AEO surface for every region keyword.
            </p>
          </div>
        </div>
      )}

      {section === "recommendations" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Strategic Recommendations</h3>
            <div className="space-y-4">
              {[
                {
                  priority: "Critical",
                  title: "Launch AI-powered multi-agent system as differentiator",
                  desc: "No competitor offers agentic workflows. PriceBot, EstimateBot, and ContractorMatch would be genuine market-first features. Prioritize this in the roadmap.",
                  impact: "High",
                  effort: "High",
                  status: "done",
                },
                {
                  priority: "Critical",
                  title: "Publish 16-region rate database publicly to counter ExactoCost",
                  desc: "ExactoCost's transparency play (published live rates, llms.txt) is their credibility moat. Publish our own 16-region rate database with FAQ/JSON-LD and monthly updates — 4x their coverage, on our own data.",
                  impact: "High",
                  effort: "Medium",
                  status: "done",
                },
                {
                  priority: "High",
                  title: "Add BOQ/Excel export to paid reports — attack ExactoCost's B2B turf",
                  desc: "ExactoCost charges GHS 150/mo for SMM7/NRM2 BOQ workflows. Offer measurement-grade line items + BOQ/Excel export in Detailed/Premium reports at a one-time GHS 249 — cheaper than two months of their subscription, zero commitment.",
                  impact: "High",
                  effort: "Medium",
                  status: "pending",
                },
                {
                  priority: "Medium",
                  title: "Launch free academic tier to intercept QS students",
                  desc: "ExactoCost gives students free access, capturing tomorrow's professionals. Offer free university/lecturer access to BuildCost GH reports so graduates default to us, not them.",
                  impact: "Medium",
                  effort: "Low",
                  status: "pending",
                },
                {
                  priority: "Critical",
                  title: "Build a free tier to capture top-of-funnel users",
                  desc: "Every major competitor offers free estimates. A basic free tier (summary only) would improve conversion and SEO rankings.",
                  impact: "High",
                  effort: "Low",
                  status: "done",
                },
                {
                  priority: "High",
                  title: "Expand regional pricing to all 16 Ghana regions",
                  desc: "GhanaHousePlanner has this. Users expect location-specific pricing. Without it, BuildCost GH loses credibility for regional accuracy.",
                  impact: "High",
                  effort: "Medium",
                  status: "done",
                },
                {
                  priority: "High",
                  title: "Develop mobile app (React Native) for on-site estimation",
                  desc: "ToSi has mobile. Most construction happens on-site. A mobile app with offline mode and photo capture would be a strong differentiator.",
                  impact: "Medium",
                  effort: "High",
                  status: "pending",
                },
                {
                  priority: "High",
                  title: "Add contractor marketplace with verified profiles",
                  desc: "CostmyBuild and ToSi have marketplaces. This is a major revenue stream (commission-based) that BuildCost GH is missing.",
                  impact: "High",
                  effort: "High",
                  status: "done",
                },
                {
                  priority: "Medium",
                  title: "Pursue academic research validation",
                  desc: "GhanaHousePlanner's UCC/KNUST study gives them credibility. Partner with a Ghanaian university for a comparative cost study.",
                  impact: "Medium",
                  effort: "Medium",
                  status: "in-progress",
                },
                {
                  priority: "Medium",
                  title: "Implement subscription model alongside one-time reports",
                  desc: "Recurring revenue is essential for valuation. Target $19/mo basic tier with monthly estimate credits.",
                  impact: "High",
                  effort: "Medium",
                  status: "done",
                },
                {
                  priority: "Low",
                  title: "Explore B2B API licensing for real estate platforms",
                  desc: "No competitor offers embeddable estimates. Banks, real estate sites, and fintech apps could integrate BuildCost GH estimates via API.",
                  impact: "Medium",
                  effort: "Medium",
                  status: "done",
                },
              ].map((r, i) => (
                <div key={i} className={`rounded-xl border p-5 ${
                  r.priority === "Critical" ? "border-red-200 bg-red-50" : r.priority === "High" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white"
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.priority === "Critical" ? "bg-red-500 text-white" : r.priority === "High" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
                      }`}>{r.priority}</span>
                      <h4 className="font-bold text-slate-900">{r.title}</h4>
                      {r.status === "done" && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          <CheckCircle className="h-3 w-3" /> DONE
                        </span>
                      )}
                      {r.status === "in-progress" && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          <Clock className="h-3 w-3" /> IN PROGRESS
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Impact: <strong className={r.impact === "High" ? "text-emerald-600" : "text-amber-600"}>{r.impact}</strong></span>
                      <span>Effort: <strong className={r.effort === "High" ? "text-red-600" : r.effort === "Medium" ? "text-amber-600" : "text-emerald-600"}>{r.effort}</strong></span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Competitive moat summary */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white">
            <h3 className="font-bold text-lg mb-3">BuildCost GH Competitive Moat</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Data Network Effect", desc: "Each paid estimate improves cost accuracy. No competitor has a paid feedback loop to refine pricing models." },
                { title: "AI Agent First-Mover", desc: "Multi-agent system (PriceBot, EstimateBot, ContractorMatch) is unique. Competitors have single AI features, not orchestrated workflows." },
                { title: "Full-Stack Platform", desc: "Estimation + payment + CRM + blog + admin + diaspora tools in one platform. Competitors offer point solutions." },
              ].map((m) => (
                <div key={m.title} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
                  <h4 className="font-bold text-emerald-200 text-sm mb-1">{m.title}</h4>
                  <p className="text-xs text-emerald-100/80">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Contractor Manager ── */
function ContractorManager() {
  const [contractors, setContractors] = useState<AdminContractor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AdminContractor | null>(null)
  const [form, setForm] = useState({
    name: "", title: "", phone: "", email: "", description: "", specialties: "", yearsOfExperience: 0,
    verified: false, website: "", licenseInfo: "", insurance: "", projectScale: "",
    companyType: "", legalName: "", yearEstablished: "", registrationStatus: "",
    city: "", region: "", district: "",
    mwhBuildingClass: "", mwhCivilClass: "", mwhElectricalClass: "", mwhPlumbingClass: "", mrhRoadClass: "",
    classificationSource: "", classificationExpiry: "", classificationNotVerified: false,
    verificationLevel: 0, dataConfidence: 50, featured: false,
    sourcesJson: "", projectsJson: "",
  })
  const [saving, setSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/contractors")
      setContractors(await res.json())
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const res = await fetch("/api/admin/contractors")
        const data = await res.json()
        if (!ignore) setContractors(data)
      } catch {} finally { if (!ignore) setLoading(false) }
    }
    load()
    return () => { ignore = true }
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({
      name: "", title: "", phone: "", email: "", description: "", specialties: "", yearsOfExperience: 0,
      verified: false, website: "", licenseInfo: "", insurance: "", projectScale: "",
      companyType: "", legalName: "", yearEstablished: "", registrationStatus: "",
      city: "", region: "", district: "",
      mwhBuildingClass: "", mwhCivilClass: "", mwhElectricalClass: "", mwhPlumbingClass: "", mrhRoadClass: "",
      classificationSource: "", classificationExpiry: "", classificationNotVerified: false,
      verificationLevel: 0, dataConfidence: 50, featured: false,
      sourcesJson: "", projectsJson: "",
    })
    setShowForm(true)
  }

  const openEdit = (c: AdminContractor) => {
    setEditing(c)
    setForm({
      name: c.name, title: c.title || "", phone: c.phone, email: c.email || "",
      description: c.description, specialties: (JSON.parse(JSON.stringify(c.specialties)) || []).join(", "),
      yearsOfExperience: c.yearsOfExperience, verified: c.verified, website: c.website || "",
      licenseInfo: c.licenseInfo || "", insurance: c.insurance || "", projectScale: c.projectScale || "",
      companyType: c.companyType || "", legalName: c.legalName || "",
      yearEstablished: c.yearEstablished ? String(c.yearEstablished) : "", registrationStatus: c.registrationStatus || "",
      city: c.city || "", region: c.region || "", district: c.district || "",
      mwhBuildingClass: c.mwhBuildingClass || "", mwhCivilClass: c.mwhCivilClass || "",
      mwhElectricalClass: c.mwhElectricalClass || "", mwhPlumbingClass: c.mwhPlumbingClass || "",
      mrhRoadClass: c.mrhRoadClass || "",
      classificationSource: c.classificationSource || "",
      classificationExpiry: c.classificationExpiry ? c.classificationExpiry.slice(0, 10) : "",
      classificationNotVerified: c.classificationNotVerified,
      verificationLevel: c.verificationLevel || 0, dataConfidence: c.dataConfidence || 50,
      featured: c.featured,
      sourcesJson: JSON.stringify(c.sources || [], null, 2),
      projectsJson: JSON.stringify(c.projects || [], null, 2),
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    setSaving(true)
    const specialties = form.specialties.split(",").map((s: string) => s.trim()).filter(Boolean)

    let sources: AdminContractorSource[] = []
    let projects: AdminContractorProject[] = []
    try {
      const parsedSources = JSON.parse(form.sourcesJson || "[]")
      if (Array.isArray(parsedSources)) sources = parsedSources
    } catch {}
    try {
      const parsedProjects = JSON.parse(form.projectsJson || "[]")
      if (Array.isArray(parsedProjects)) projects = parsedProjects
    } catch {}

    const { sourcesJson, projectsJson, ...scalars } = form
    const body: Record<string, unknown> = {
      ...scalars,
      specialties,
      yearEstablished: scalars.yearEstablished ? parseInt(scalars.yearEstablished) || null : null,
      classificationExpiry: scalars.classificationExpiry ? `${scalars.classificationExpiry}T00:00:00.000Z` : null,
      id: editing?.id,
    }
    // Only replace sources/projects when the admin provides non-empty lists;
    // omitting them preserves the existing relations on update.
    if (sources.length) body.sources = sources
    if (projects.length) body.projects = projects
    try {
      const url = "/api/admin/contractors"
      const method = editing ? "PUT" : "POST"
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      setShowForm(false); setEditing(null)
      setLoading(true)
      fetchAll()
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contractor?")) return
    await fetch(`/api/admin/contractors?id=${id}`, { method: "DELETE" })
    setLoading(true)
    fetchAll()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Contractor Management</h2>
        <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all">
          <Plus className="h-4 w-4" /> Add Contractor
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">{editing ? "Edit" : "New"} Contractor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone *</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Years of Experience</Label>
              <Input type="number" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) || 0 })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Description *</Label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full h-24 rounded-lg border border-gray-200 text-sm p-3 resize-none" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Specialties (comma-separated)</Label>
              <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Company / Location</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input placeholder="Company type (e.g. Limited Liability)" value={form.companyType} onChange={(e) => setForm({ ...form, companyType: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Legal name" value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Year established" type="number" value={form.yearEstablished} onChange={(e) => setForm({ ...form, yearEstablished: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Region (e.g. Greater Accra)" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Registry status (registered / not-verified / unknown)" value={form.registrationStatus} onChange={(e) => setForm({ ...form, registrationStatus: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Official Classification (Ministry of Works &amp; Housing / ABCEC)</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Input placeholder="Building (A1-A4)" value={form.mwhBuildingClass} onChange={(e) => setForm({ ...form, mwhBuildingClass: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Civil (B1-B4)" value={form.mwhCivilClass} onChange={(e) => setForm({ ...form, mwhCivilClass: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Electrical (L1-L3)" value={form.mwhElectricalClass} onChange={(e) => setForm({ ...form, mwhElectricalClass: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Plumbing (G1-G2)" value={form.mwhPlumbingClass} onChange={(e) => setForm({ ...form, mwhPlumbingClass: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Road (MRH)" value={form.mrhRoadClass} onChange={(e) => setForm({ ...form, mrhRoadClass: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <Input placeholder="Classification source (e.g. Ministry of Works and Housing)" value={form.classificationSource} onChange={(e) => setForm({ ...form, classificationSource: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="Certificate expiry (YYYY-MM-DD)" type="date" value={form.classificationExpiry} onChange={(e) => setForm({ ...form, classificationExpiry: e.target.value })} className="h-9 text-sm" />
                <Input placeholder="License / registration no." value={form.licenseInfo} onChange={(e) => setForm({ ...form, licenseInfo: e.target.value })} className="h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Verification &amp; Listing</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input placeholder="Insurance" value={form.insurance} onChange={(e) => setForm({ ...form, insurance: e.target.value })} className="h-9 text-sm" />
                <select
                  value={form.projectScale}
                  onChange={(e) => setForm({ ...form, projectScale: e.target.value })}
                  className="h-9 rounded-lg border border-gray-200 text-sm px-2 bg-white"
                >
                  <option value="">Project scale</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="Major">Major</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
                <Input type="number" placeholder="Verification level (0-5)" min={0} max={5} value={form.verificationLevel} onChange={(e) => setForm({ ...form, verificationLevel: Math.max(0, Math.min(5, parseInt(e.target.value) || 0)) })} className="h-9 text-sm" />
                <Input type="number" placeholder="Data confidence (0-100)" min={0} max={100} value={form.dataConfidence} onChange={(e) => setForm({ ...form, dataConfidence: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })} className="h-9 text-sm" />
              </div>
              <div className="flex flex-wrap items-center gap-5 mt-3 text-sm text-gray-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.classificationNotVerified} onChange={(e) => setForm({ ...form, classificationNotVerified: e.target.checked })} className="rounded border-gray-300 text-emerald-600" />
                  Classification not independently verified
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded border-gray-300 text-emerald-600" />
                  Featured
                </label>
              </div>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Sources (JSON array: [{`{ tier, label, url, confidence, lastVerifiedAt }`}])</Label>
              <textarea value={form.sourcesJson} onChange={(e) => setForm({ ...form, sourcesJson: e.target.value })} placeholder='[{"tier":"official","label":"ABCEC Register","url":"https://...","confidence":95}]' className="w-full h-28 rounded-lg border border-gray-200 text-xs font-mono p-3 resize-none" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs">Projects (JSON array: [{`{ name, type, location, year, value, description, imageUrl, sort }`}])</Label>
              <textarea value={form.projectsJson} onChange={(e) => setForm({ ...form, projectsJson: e.target.value })} placeholder='[{"name":"Office Block","type":"Commercial","location":"Accra","year":2024,"value":1500000}]' className="w-full h-28 rounded-lg border border-gray-200 text-xs font-mono p-3 resize-none" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="rounded border-gray-300 text-emerald-600" />
              Verified
            </label>
            <div className="flex-1" />
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name || !form.phone || !form.description} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Class</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Phone</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Verified</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Rating</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : contractors.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No contractors yet</td></tr>
              ) : contractors.map((c: AdminContractor) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-400">{c.title || c.city || ""}</div>
                  </td>
                  <td className="py-3 px-4">
                    {[c.mwhBuildingClass, c.mwhCivilClass, c.mwhElectricalClass, c.mwhPlumbingClass, c.mrhRoadClass].filter(Boolean).length > 0 ? (
                      <span className="flex flex-wrap gap-1">
                        {[c.mwhBuildingClass && `A:${c.mwhBuildingClass}`, c.mwhCivilClass && `B:${c.mwhCivilClass}`, c.mwhElectricalClass && `L:${c.mwhElectricalClass}`, c.mwhPlumbingClass && `G:${c.mwhPlumbingClass}`, c.mrhRoadClass && `R:${c.mrhRoadClass}`].filter(Boolean).map((cls) => (
                          <span key={cls} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-medium border border-emerald-100">{cls}</span>
                        ))}
                      </span>
                    ) : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{c.phone}</td>
                  <td className="py-3 px-4 text-center">{c.verified ? <BadgeCheck className="h-4 w-4 text-emerald-600 mx-auto" /> : <span className="text-gray-300">-</span>}</td>
                  <td className="py-3 px-4 text-center"><span className="flex items-center justify-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{c.rating.toFixed(1)}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"><Edit className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/* ── Command Center ── */
function CommandCenter() {
  const [subTab, setSubTab] = useState("dashboard")
  const [logs, setLogs] = useState<AgentLogItem[]>([])
  const [queueStats, setQueueStats] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 })
  const [loading, setLoading] = useState(true)
  const [agentStats, setAgentStats] = useState<AgentStat[]>([])
  const [keys, setKeys] = useState<AdminApiKey[]>([])
  const [factors, setFactors] = useState<AdminSeasonalFactor[]>([])
  const [rules, setRules] = useState<Record<string, string>>({})
  const [savingRules, setSavingRules] = useState(false)

  const fetchData = async () => {
    try {
      const [hRes, lRes, aRes] = await Promise.all([
        fetch("/api/health").then(r => r.json()).catch(() => ({})),
        fetch("/api/agent-logs?limit=50").then(r => r.json()).catch(() => ({ logs: [] })),
        fetch("/api/admin/agent-stats").then(r => r.json()).catch(() => []),
      ])
      if (hRes.queue) setQueueStats(hRes.queue)
      setLogs(lRes.logs || [])
      setAgentStats(aRes)
    } finally {
      setLoading(false)
    }
  }

  const fetchConfig = async () => {
    const [rRes, kRes, fRes] = await Promise.all([
      fetch("/api/admin/rules").then(r => r.json()).catch(() => ({})),
      fetch("/api/admin/api-keys").then(r => r.json()).catch(() => []),
      fetch("/api/admin/seasonal-factors").then(r => r.json()).catch(() => []),
    ])
    setRules(rRes)
    setKeys(kRes)
    setFactors(fRes)
  }

  useEffect(() => {
    let ignore = false
    const load = async () => {
      const [hRes, lRes, aRes] = await Promise.all([
        fetch("/api/health").then(r => r.json()).catch(() => ({})),
        fetch("/api/agent-logs?limit=50").then(r => r.json()).catch(() => ({ logs: [] })),
        fetch("/api/admin/agent-stats").then(r => r.json()).catch(() => []),
      ])
      const [rRes, kRes, fRes] = await Promise.all([
        fetch("/api/admin/rules").then(r => r.json()).catch(() => ({})),
        fetch("/api/admin/api-keys").then(r => r.json()).catch(() => []),
        fetch("/api/admin/seasonal-factors").then(r => r.json()).catch(() => []),
      ])
      if (ignore) return
      if (hRes.queue) setQueueStats(hRes.queue)
      setLogs(lRes.logs || [])
      setAgentStats(aRes)
      setRules(rRes)
      setKeys(kRes)
      setFactors(fRes)
      setLoading(false)
    }
    load()
    const i = setInterval(fetchData, 15000)
    return () => { ignore = true; clearInterval(i) }
  }, [])

  const saveRules = async () => {
    setSavingRules(true)
    await fetch("/api/admin/rules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rules) })
    setSavingRules(false)
  }

  const setRule = (key: string, value: string) => setRules(prev => ({ ...prev, [key]: value }))

  const subTabs = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "feed", label: "Activity", icon: Clock },
    { id: "queue", label: "Queue", icon: CheckSquare },
    { id: "agents", label: "Agents", icon: Cpu },
    { id: "config", label: "Configuration", icon: Sliders },
  ]

  const monthLabels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1.5">
        {subTabs.map((st) => (
          <button key={st.id} onClick={() => setSubTab(st.id)}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
              subTab === st.id ? "bg-emerald-100 text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            }`}>
            <st.icon className="h-4 w-4" /> {st.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>}

      {!loading && subTab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Pending Jobs", value: queueStats.pending, icon: Clock, bg: "from-amber-500 to-amber-600" },
              { label: "Processing", value: queueStats.processing, icon: RefreshCw, bg: "from-blue-500 to-blue-600" },
              { label: "Completed", value: queueStats.completed, icon: CheckCircle, bg: "from-emerald-500 to-emerald-600" },
              { label: "Failed", value: queueStats.failed, icon: AlertCircle, bg: "from-red-500 to-red-600" },
            ].map((c) => (
              <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-xl p-4 text-white shadow-lg`}>
                <c.icon className="h-5 w-5 opacity-80 mb-2" />
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-xs opacity-80 mt-1">{c.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-emerald-600" /> Agent Health
              </h3>
              <div className="space-y-2">
                {agentStats.map((a: AgentStat) => (
                  <div key={a.name} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      a.status === "active" ? "bg-emerald-500" : a.status === "error" ? "bg-red-500" : "bg-slate-300"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{a.name}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                          a.status === "active" ? "bg-emerald-50 text-emerald-600" :
                          a.status === "error" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                        }`}>{a.status}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {a.totalActions} actions · {a.errors} errors
                        {a.minutesSinceLastSeen !== null && ` · ${a.minutesSinceLastSeen}m ago`}
                      </p>
                    </div>
                  </div>
                ))}
                {agentStats.length === 0 && <p className="text-sm text-slate-400">No agent data yet</p>}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-600" /> Recent Activity
              </h3>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {logs.slice(0, 12).map((log: AgentLogItem) => (
                  <div key={log.id} className="flex items-start gap-2 text-sm p-1.5 rounded hover:bg-slate-50">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      log.level === "error" ? "bg-red-500" : log.level === "warning" ? "bg-amber-500" :
                      log.level === "success" ? "bg-emerald-500" : "bg-blue-500"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-slate-700">{log.agent}</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-600">{log.action}</span>
                      <p className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString("en-GH")}</p>
                    </div>
                  </div>
                ))}
                {logs.length === 0 && <p className="text-sm text-slate-400">No activity yet</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && subTab === "feed" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Activity Feed</h3>
              <p className="text-sm text-slate-400 mt-1">All autonomous agent actions, webhooks, and emails</p>
            </div>
            <span className="text-xs text-slate-400">{logs.length} events</span>
          </div>
          <div className="p-5">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No activity recorded yet.</p>
            ) : (
              <div className="space-y-0.5">
                {logs.map((log: AgentLogItem) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-slate-50 text-sm border-l-2 transition-colors"
                    style={{ borderLeftColor: log.level === "error" ? "#ef4444" : log.level === "warning" ? "#f59e0b" : log.level === "success" ? "#10b981" : "#3b82f6" }}>
                    <span className="text-[11px] text-slate-400 font-mono w-14 flex-shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="font-medium text-slate-700 w-20 flex-shrink-0 text-xs">{log.agent}</span>
                    <span className="text-slate-600 flex-1 text-xs">{log.action}</span>
                    {log.entityType && (
                      <span className="text-[11px] text-slate-400 flex-shrink-0">{log.entityType} {log.entityId?.slice(0, 10)}</span>
                    )}
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize flex-shrink-0 ${
                      log.level === "error" ? "bg-red-50 text-red-600" : log.level === "warning" ? "bg-amber-50 text-amber-600" :
                      log.level === "success" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    }`}>{log.level}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && subTab === "queue" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">Job Queue</h3>
              <p className="text-sm text-slate-400 mt-1">{queueStats.pending} pending · {queueStats.failed} failed · {queueStats.completed} completed</p>
            </div>
            <div className="flex gap-2">
              <button onClick={async () => { await fetch("/api/jobs/enqueue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "process_queue" }) }); fetchData() }}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">Process Queue</button>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Pending", value: queueStats.pending, color: "text-amber-600" },
                { label: "Processing", value: queueStats.processing, color: "text-blue-600" },
                { label: "Completed", value: queueStats.completed, color: "text-emerald-600" },
                { label: "Failed", value: queueStats.failed, color: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 rounded-lg bg-slate-50">
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            {queueStats.failed > 0 && (
              <button onClick={async () => { await fetch("/api/jobs/retry-failed", { method: "POST" }); fetchData() }}
                className="px-3 py-1.5 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Retry All Failed ({queueStats.failed})
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && subTab === "agents" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors flex items-center gap-1.5">
              <Pause className="h-4 w-4" /> Pause All Agents
            </button>
            <button onClick={async () => { await fetch("/api/jobs/clear", { method: "POST" }); fetchData() }}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-1.5">
              <Trash2 className="h-4 w-4" /> Clear All Jobs
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agentStats.map((a: AgentStat) => (
              <div key={a.name} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      a.status === "active" ? "bg-emerald-500" : a.status === "error" ? "bg-red-500" : "bg-slate-300"
                    }`} />
                    <h4 className="font-semibold text-sm text-slate-900">{a.name}</h4>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                    a.status === "active" ? "bg-emerald-50 text-emerald-600" :
                    a.status === "error" ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
                  }`}>{a.status}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="font-semibold text-slate-700">{a.totalActions}</div>
                    <div className="text-slate-400">Actions</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className={`font-semibold ${a.errors > 0 ? "text-red-600" : "text-slate-700"}`}>{a.errors}</div>
                    <div className="text-slate-400">Errors</div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <div className="font-semibold text-slate-700">
                      {a.minutesSinceLastSeen !== null ? `${a.minutesSinceLastSeen}m` : "—"}
                    </div>
                    <div className="text-slate-400">Last Seen</div>
                  </div>
                </div>
                {a.lastAction && (
                  <p className="text-[11px] text-slate-400 mt-2">Last: {a.lastAction}</p>
                )}
              </div>
            ))}
            {agentStats.length === 0 && <p className="text-sm text-slate-400 col-span-full text-center py-8">No agent data. Run some actions first.</p>}
          </div>
        </div>
      )}

      {!loading && subTab === "config" && (
        <div className="space-y-8">
          {/* Business Rules */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Business Rules</h3>
                <p className="text-sm text-slate-400 mt-1">Thresholds for autonomous behavior</p>
              </div>
              <button onClick={saveRules} disabled={savingRules}
                className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {savingRules ? "Saving..." : "Save Rules"}
              </button>
            </div>
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: "maxAutoPriceChangePct", label: "Max Auto Price Change (%)", min: "1", max: "20", step: "1", suffix: "%" },
                  { key: "leadScoreHITLThreshold", label: "Lead Score HITL Threshold", min: "0", max: "100", step: "5", suffix: "" },
                  { key: "maxUnattendedOrderValue", label: "Max Unattended Order (GHS)", min: "100", max: "5000", step: "100", suffix: "" },
                  { key: "autoRefundMax", label: "Auto Refund Max (GHS)", min: "0", max: "500", step: "10", suffix: "" },
                ].map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">{field.label}</label>
                    <div className="flex items-center gap-3">
                      <input type="range" min={field.min} max={field.max} step={field.step}
                        value={rules[field.key] || "0"} onChange={(e) => setRule(field.key, e.target.value)}
                        className="flex-1 accent-emerald-600" />
                      <span className="text-sm font-mono text-slate-700 w-16 text-right">
                        {Number(rules[field.key] || 0).toLocaleString()}{field.suffix}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Alert Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { key: "alertsErrorSpike", label: "Error spike (>5 errors in 10 min)" },
                    { key: "alertsPaymentFailure", label: "Payment failure notification" },
                    { key: "alertsQueueBacklog", label: "Queue backlog (>50 pending jobs)" },
                    { key: "alertsPricingDrift", label: "Pricing drift (>10% from market)" },
                    { key: "alertsHighValueLead", label: "High-value lead alert (score > 80)" },
                  ].map((alert) => (
                    <label key={alert.key} className="flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" checked={rules[alert.key] === "true"}
                        onChange={(e) => setRule(alert.key, e.target.checked ? "true" : "false")}
                        className="rounded accent-emerald-600" />
                      {alert.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* API Keys */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">API Keys</h3>
                <p className="text-sm text-slate-400 mt-1">For MCP agent authentication and external integrations</p>
              </div>
              <button onClick={async () => {
                const label = prompt("Enter a label for this API key:")
                if (!label) return
                const res = await fetch("/api/admin/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label }) })
                const data = await res.json()
                if (data.rawKey) {
                  alert(`Key created!\n\nLabel: ${data.label}\nKey: ${data.rawKey}\n\nSave this key — it will not be shown again.`)
                  fetchConfig()
                }
              }} className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                + New Key
              </button>
            </div>
            <div className="p-5">
              {keys.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No API keys created yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-2 font-medium text-slate-600">Label</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Key Hash</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Tier</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Usage</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Status</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Created</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Last Used</th>
                      <th className="text-right pb-2 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.map((k: AdminApiKey) => (
                      <tr key={k.id} className="border-b border-gray-50 hover:bg-slate-50">
                        <td className="py-2 text-slate-700">{k.label}</td>
                        <td className="py-2 text-xs text-slate-400 font-mono">{k.keyHash.slice(0, 16)}...</td>
                        <td className="py-2 text-xs"><span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{k.tier || "dev"}</span></td>
                        <td className="py-2 text-xs text-slate-400">{k.usageCount ?? 0}/{k.monthlyLimit ?? 100}</td>
                        <td className="py-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${k.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                            {k.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-2 text-xs text-slate-400">{new Date(k.createdAt).toLocaleDateString("en-GH")}</td>
                        <td className="py-2 text-xs text-slate-400">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString("en-GH") : "—"}</td>
                        <td className="py-2 text-right">
                          <button onClick={async () => {
                            if (!confirm("Revoke this API key?")) return
                            await fetch(`/api/admin/api-keys/${k.id}`, { method: "DELETE" })
                            fetchConfig()
                          }} className="text-xs text-red-500 hover:text-red-700 font-medium">Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Seasonal Factors */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">Seasonal Factors</h3>
                <p className="text-sm text-slate-400 mt-1">Pricing multipliers by region and month</p>
              </div>
              <button onClick={async () => {
                const month = prompt("Month (1-12):")
                const multiplier = prompt("Multiplier (e.g. 1.05 for +5%):")
                const region = prompt("Region (optional, e.g. greater-accra):")
                const material = prompt("Material (optional, e.g. cement):")
                const reason = prompt("Reason (optional):")
                if (!month || !multiplier) return
                await fetch("/api/admin/seasonal-factors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month: Number(month), multiplier: Number(multiplier), region: region || null, material: material || null, reason: reason || null }) })
                fetchConfig()
              }} className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                + Add Factor
              </button>
            </div>
            <div className="p-5">
              {factors.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No seasonal factors configured.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-2 font-medium text-slate-600">Month</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Region</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Material</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Multiplier</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Reason</th>
                      <th className="text-left pb-2 font-medium text-slate-600">Active</th>
                      <th className="text-right pb-2 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factors.map((f: AdminSeasonalFactor) => (
                      <tr key={f.id} className="border-b border-gray-50 hover:bg-slate-50">
                        <td className="py-2 text-slate-700">{f.monthLabel || monthLabels[f.month - 1]}</td>
                        <td className="py-2 text-xs text-slate-400">{f.region || "All"}</td>
                        <td className="py-2 text-xs text-slate-400">{f.material || "All"}</td>
                        <td className="py-2 font-mono text-sm">{(f.multiplier > 0 ? "+" : "")}{(f.multiplier * 100 - 100).toFixed(0)}%</td>
                        <td className="py-2 text-xs text-slate-400">{f.reason || "—"}</td>
                        <td className="py-2">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${f.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                            {f.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <button onClick={async () => {
                            if (!confirm("Delete this factor?")) return
                            await fetch(`/api/admin/seasonal-factors/${f.id}`, { method: "DELETE" })
                            fetchConfig()
                          }} className="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Login ── */
function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoggingIn(true)
    const res = await signIn("credentials", { email, password, redirect: false })
    setLoggingIn(false)
    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage your store</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-email" className="text-sm font-medium text-slate-700">Email</Label>
            <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" required className="h-11" />
          </div>
          <PasswordField
            id="login-password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter password"
            autoComplete="current-password"
            showGenerate={false}
          />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <Button type="submit" disabled={loggingIn} className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 border-0 hover:from-emerald-600 hover:to-emerald-700">
            {loggingIn ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  )
}

/* ── Regional Rates ── */
type RegionRateItem = {
  id: string
  name: string
  slug: string
  capital: string
  multiplier: number
  labourRate: number
  cementBag: number
  rebarTon: number
  block: number
  sandTrip: number
  graniteTrip: number
  timber: number
  roofingSqm: number
  dieselLit: number
  paintLit: number
  source: string | null
  notes: string | null
  published: boolean
  updatedAt: string
}

const RATE_FIELDS: { key: keyof RegionRateItem; label: string; hint: string }[] = [
  { key: "cementBag", label: "Cement (50kg)", hint: "GHS/bag" },
  { key: "rebarTon", label: "Rebar", hint: "GHS/tonne" },
  { key: "block", label: "Block", hint: "GHS/block" },
  { key: "sandTrip", label: "Sand", hint: "GHS/trip" },
  { key: "graniteTrip", label: "Granite", hint: "GHS/trip" },
  { key: "timber", label: "Timber", hint: "GHS/length" },
  { key: "roofingSqm", label: "Roofing", hint: "GHS/SQM" },
  { key: "dieselLit", label: "Diesel", hint: "GHS/L" },
  { key: "paintLit", label: "Paint", hint: "GHS/L" },
]

function RegionRatesTab() {
  const [rates, setRates] = useState<RegionRateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, Partial<RegionRateItem>>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/rates")
      .then((r) => r.json())
      .then((data: RegionRateItem[]) => setRates(data))
      .catch(() => setRates([]))
      .finally(() => setLoading(false))
  }, [])

  const update = (id: string, field: string, value: string) => {
    setDraft((d) => ({ ...d, [id]: { ...(d[id] || {}), [field]: value } }))
  }

  const save = async (r: RegionRateItem) => {
    setSavingId(r.id)
    try {
      const changes = draft[r.id] || {}
      const payload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(changes)) {
        if (typeof v === "string") payload[k] = k === "multiplier" || k === "labourRate" || k === "cementBag" || k === "rebarTon" || k === "block" || k === "sandTrip" || k === "graniteTrip" || k === "timber" || k === "roofingSqm" || k === "dieselLit" || k === "paintLit" ? Number(v) : v
        else payload[k] = v
      }
      if (Object.keys(payload).length === 0) return
      const res = await fetch(`/api/admin/rates/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const updated = await res.json()
      if (res.ok) {
        setRates((rs) => rs.map((x) => (x.id === r.id ? updated : x)))
        setDraft((d) => { const nd = { ...d }; delete nd[r.id]; return nd })
        toast.success(`${updated.name} rates saved`)
      } else {
        toast.error(updated.error || "Failed to save")
      }
    } catch {
      toast.error("Failed to save")
    } finally {
      setSavingId(null)
    }
  }

  const togglePublished = async (r: RegionRateItem) => {
    const res = await fetch(`/api/admin/rates/${r.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !r.published }),
    })
    const updated = await res.json()
    if (res.ok) {
      setRates((rs) => rs.map((x) => (x.id === r.id ? updated : x)))
      toast.success(`${updated.name} ${updated.published ? "published" : "hidden"}`)
    }
  }

  const val = (r: RegionRateItem, field: string) =>
    (draft[r.id] as Record<string, string | number | boolean | null> | undefined)?.[field] ?? r[field as keyof RegionRateItem]

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <Globe className="h-6 w-6 text-emerald-600" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Regional Rate Database</h2>
            <p className="text-sm text-slate-500">
              Live rates shown on /costs and /costs/[region]. Published rows feed the sitemap, llms-full.txt and public /api/rates.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
            <span className="text-2xl font-bold text-emerald-700">{rates.length}</span>
            <span className="ml-2 text-emerald-900 font-medium">regions</span>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5">
            <span className="text-2xl font-bold text-slate-800">{rates.filter((r) => r.published).length}</span>
            <span className="ml-2 text-slate-600 font-medium">published</span>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
            <span className="text-sm text-amber-900">
              Baseline: Greater Accra = 1.00x. Rows sync automatically to public pages.
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {rates.map((r) => {
          const isOpen = expanded === r.id
          const dirty = Object.keys(draft[r.id] || {}).length > 0
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : r.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${r.published ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <div>
                    <p className="font-bold text-slate-900">{r.name} <span className="font-normal text-slate-400">· {r.capital}</span></p>
                    <p className="text-xs text-slate-500">
                      Factor {r.multiplier.toFixed(2)}x · Cement {fmtGhs(Number(val(r, "cementBag")))}/bag · Labour {fmtGhs(Number(val(r, "labourRate")))}/day · Updated {new Date(r.updatedAt).toLocaleDateString("en-GH")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dirty && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Unsaved</span>}
                  <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500">Region name</Label>
                      <Input value={String(val(r, "name"))} onChange={(e) => update(r.id, "name", e.target.value)} className="h-10" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Capital</Label>
                      <Input value={String(val(r, "capital"))} onChange={(e) => update(r.id, "capital", e.target.value)} className="h-10" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Cost factor (vs Accra)</Label>
                      <Input value={String(val(r, "multiplier"))} onChange={(e) => update(r.id, "multiplier", e.target.value)} className="h-10" inputMode="decimal" />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500">Labour rate GHS/day</Label>
                      <Input value={String(val(r, "labourRate"))} onChange={(e) => update(r.id, "labourRate", e.target.value)} className="h-10" inputMode="numeric" />
                    </div>
                    {RATE_FIELDS.map((f) => (
                      <div key={f.key}>
                        <Label className="text-xs text-slate-500">{f.label}</Label>
                        <Input value={String(val(r, f.key))} onChange={(e) => update(r.id, f.key, e.target.value)} className="h-10" inputMode="numeric" placeholder={f.hint} />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <Label className="text-xs text-slate-500">Source note</Label>
                      <Input value={String(val(r, "source") ?? "")} onChange={(e) => update(r.id, "source", e.target.value)} className="h-10" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-slate-500">Notes</Label>
                      <Input value={String(val(r, "notes") ?? "")} onChange={(e) => update(r.id, "notes", e.target.value)} className="h-10" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={() => save(r)} disabled={savingId === r.id || !dirty} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      {savingId === r.id ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : <><CheckCircle className="mr-2 h-4 w-4" /> Save</>}
                    </Button>
                    <Button variant="outline" onClick={() => togglePublished(r)}>
                      <Eye className="mr-2 h-4 w-4" /> {r.published ? "Hide from site" : "Publish"}
                    </Button>
                    <span className="text-xs text-slate-400">/costs/{r.slug}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Content Marketing ── */
type ContentPostItem = {
  id: string; platform: string; status: string
  externalUrl: string | null; error: string | null; publishedAt: string | null
}

type ContentDraftItem = {
  id: string; kind: string; title: string; caption: string; body: string | null
  offer: Record<string, unknown> | null; platforms: string[]
  status: string; reviewNote: string | null
  createdAt: string; approvedAt: string | null; publishedAt: string | null
  posts: ContentPostItem[]
}

const CONTENT_PLATFORM_LABELS: Record<string, string> = {
  facebook: "Facebook", instagram: "Instagram", x: "X", linkedin: "LinkedIn", tiktok: "TikTok",
}

const CONTENT_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  published: "bg-indigo-100 text-indigo-700",
}

type PlanSlotView = {
  date: string
  weekday: number
  kind: string
  platforms: string[]
  pillar: string
  pillarTitle: string
  topic: string
  keyword: string | null
  offer: string
  status: "drafted" | "planned"
}

type PlanView = {
  meta: {
    title: string
    rollingStart: string
    rollingMonths: number
    postsPerWeek: number
    language: string
    publishingMode: string
    batchMode: string
  }
  totalSlots: number
  draftedSlots: number
  slots: PlanSlotView[]
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function ContentMarketingTab() {
  const [drafts, setDrafts] = useState<ContentDraftItem[]>([])
  const [plan, setPlan] = useState<PlanView | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [planning, setPlanning] = useState(false)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/content")
      .then((r) => r.json())
      .then((data: ContentDraftItem[]) => setDrafts(data))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false))
    fetch("/api/content/plan")
      .then((r) => r.json())
      .then((data: PlanView) => setPlan(data))
      .catch(() => setPlanError("Could not load the Content Plan"))
  }, [])

  const refresh = async () => {
    const res = await fetch("/api/content")
    if (res.ok) setDrafts(await res.json())
    const planRes = await fetch("/api/content/plan")
    if (planRes.ok) setPlan(await planRes.json())
  }

  const fillPlan = async () => {
    setPlanning(true)
    setPlanError(null)
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: true }),
      })
      const data = await res.json()
      if (res.ok && data.plan) {
        const generated = Array.isArray(data.drafts) ? data.drafts.length : data.generated ?? 0
        toast.success(`${generated} plan draft${generated === 1 ? "" : "s"} generated — review in the queue`)
        await refresh()
      } else {
        toast.error(data.error || "Plan batch failed")
        setPlanError(data.error || "Plan batch failed")
      }
    } catch {
      toast.error("Plan batch failed")
      setPlanError("Plan batch failed")
    } finally {
      setPlanning(false)
    }
  }

  const generate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (res.ok && data.draft) {
        toast.success("Draft generated — review it in the queue")
        await refresh()
      } else {
        toast.error(data.error || "Generation failed")
        setError(data.error || "Generation failed")
      }
    } catch {
      toast.error("Generation failed")
      setError("Generation failed")
    } finally {
      setGenerating(false)
    }
  }

  const setStatus = async (d: ContentDraftItem, status: string) => {
    const res = await fetch(`/api/content/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      await refresh()
      toast.success(status === "approved" ? "Draft approved" : status === "rejected" ? "Draft rejected" : "Draft restored")
    } else {
      const data = await res.json().catch(() => null)
      toast.error(data?.error || "Update failed")
    }
  }

  const publish = async (d: ContentDraftItem) => {
    setPublishingId(d.id)
    try {
      const res = await fetch(`/api/content/${d.id}`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        await refresh()
        toast.success(`Published to ${data.published} platform(s)`)
      } else {
        toast.error(data.error || "Publish failed")
      }
    } catch {
      toast.error("Publish failed")
    } finally {
      setPublishingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const offerOf = (d: ContentDraftItem) => (d.offer ?? {}) as Record<string, string | number>

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Content Marketing Engine</h2>
              <p className="text-sm text-slate-500">
                The Content agent drafts a strategic post + irresistible offer from live business data. Drafts always await your approval before anything is published.
              </p>
            </div>
          </div>
          <Button onClick={generate} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
            {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate draft</>}
          </Button>
        </div>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-3">
            {error}
          </div>
        )}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
            <span className="text-2xl font-bold text-emerald-700">{drafts.length}</span>
            <span className="ml-2 text-emerald-900 font-medium">drafts</span>
          </div>
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5">
            <span className="text-2xl font-bold text-indigo-700">{drafts.filter((d) => d.status === "approved").length}</span>
            <span className="ml-2 text-indigo-900 font-medium">awaiting publish</span>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5">
            <span className="text-2xl font-bold text-slate-800">{drafts.filter((d) => d.status === "published").length}</span>
            <span className="ml-2 text-slate-600 font-medium">published</span>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5">
            <span className="text-sm text-amber-900">
              Auto-publish needs Facebook, X and/or LinkedIn credentials in env vars. Instagram/TikTok are manual.
            </span>
          </div>
        </div>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500 mb-2">No content drafts yet.</p>
          <p className="text-sm text-slate-400">Click “Generate draft” to have the Content agent create the first post + offer.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((d) => {
            const offer = offerOf(d)
            return (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CONTENT_STATUS_STYLES[d.status] || CONTENT_STATUS_STYLES.draft}`}>
                        {d.status}
                      </span>
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full uppercase">
                        {d.kind}
                      </span>
                      {d.platforms.map((p) => (
                        <span key={p} className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                          {CONTENT_PLATFORM_LABELS[p] || p}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{d.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{d.caption}</p>
                    {offer.headline && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-bold text-amber-800">Offer: {String(offer.headline)}</p>
                        <p className="text-sm text-amber-900 mt-0.5">{String(offer.detail ?? "")}</p>
                        <p className="text-xs text-amber-700 mt-1">
                          {String(offer.cta ?? "")} · expires in {String(offer.expiresInDays ?? "?")} days
                        </p>
                      </div>
                    )}
                    {d.reviewNote && <p className="text-xs text-slate-400 mt-2">Review note: {d.reviewNote}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {d.status === "draft" && (
                      <>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setStatus(d, "approved")}>
                          <CheckCircle className="mr-1.5 h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setStatus(d, "rejected")}>
                          <X className="mr-1.5 h-4 w-4" /> Reject
                        </Button>
                      </>
                    )}
                    {d.status === "approved" && (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => publish(d)} disabled={publishingId === d.id}>
                        {publishingId === d.id ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Publishing...</> : <><Send className="mr-1.5 h-4 w-4" /> Publish to social</>}
                      </Button>
                    )}
                    {d.status === "rejected" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus(d, "draft")}>
                        <RefreshCw className="mr-1.5 h-4 w-4" /> Restore to draft
                      </Button>
                    )}
                  </div>
                </div>

                {d.posts.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="flex flex-wrap gap-3">
                      {d.posts.map((p) => (
                        <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full ${p.status === "published" ? "bg-emerald-500" : p.status === "failed" ? "bg-red-500" : "bg-amber-500"}`} />
                          <span className="font-medium text-slate-700">{CONTENT_PLATFORM_LABELS[p.platform] || p.platform}</span>
                          <span className="text-slate-400 capitalize">{p.status}</span>
                          {p.externalUrl && (
                            <a href={p.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-emerald-600 hover:underline">
                              view <ExternalLink className="ml-0.5 h-3 w-3" />
                            </a>
                          )}
                          {p.error && <span className="text-red-500 max-w-xs truncate" title={p.error}>{p.error}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400 mt-3">
                  Drafted {new Date(d.createdAt).toLocaleString("en-GH")}
                  {d.publishedAt ? ` · Published ${new Date(d.publishedAt).toLocaleString("en-GH")}` : ""}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
