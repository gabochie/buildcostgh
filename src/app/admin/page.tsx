"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Roadmap } from "@/components/admin/Roadmap"
import { formatCurrency } from "@/lib/utils"
import {
  Loader2, TrendingUp, ShoppingBag, MessageSquare, Users, Mail,
  FileText, ExternalLink, Eye, Shield, CheckCircle, Clock,
  AlertCircle, ArrowRight, Plus, Search, Download,
} from "lucide-react"

type Stats = {
  totalOrders: number; completedOrders: number; pendingOrders: number
  totalRevenue: number; totalMessages: number; unreadMessages: number
  totalLeads: number; totalSubscribers: number
}

type Order = {
  id: string; fullName: string; email: string; package: string
  amount: number; status: string; reference: string; reportUrl: string | null; createdAt: string
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

const statusStyles: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
}

const statusIcons: Record<string, any> = {
  completed: CheckCircle,
  pending: Clock,
  failed: AlertCircle,
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<string>("overview")
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
    const t = searchParams.get("tab")
    if (t) setTab(t)
  }, [searchParams])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    Promise.all([
      fetch("/api/admin/stats").then(r => r.json()),
      fetch("/api/orders").then(r => r.json()),
      fetch("/api/contact").then(r => r.json()),
      fetch("/api/blog").then(r => r.json()),
      fetch("/api/calculator/save-lead").then(r => r.json()).catch(() => []),
      fetch("/api/newsletter").then(r => r.json()).catch(() => []),
      fetch("/api/admin/maintenance").then(r => r.json()).catch(() => ({ enabled: false })),
    ])
      .then(([s, o, m, b, l, n, mt]) => {
        setStats(s); setOrders(o); setMessages(m)
        setBlogPosts(b); setLeads(l); setSubscribers(n)
        setMaintenanceMode(mt.enabled)
      })
      .finally(() => setLoading(false))
  }, [session])

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
        <OrdersTab orders={orders} />
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
function OrdersTab({ orders }: { orders: Order[] }) {
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
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="font-semibold text-slate-900">GHS {order.amount}</p>
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full border mt-1 ${
                  statusStyles[order.status] || ""
                }`}>{order.status}</span>
                {order.reportUrl && (
                  <a href={order.reportUrl} target="_blank" className="block text-xs text-emerald-600 hover:underline mt-1.5 font-medium">
                    View Report &rarr;
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
function SettingsTab({ session }: { session: any }) {
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
          Production API keys for Paystack, Resend, UploadThing, and Google Auth are not configured.
        </p>
        <div className="text-xs text-slate-400 space-y-1 font-mono">
          <p>PAYSTACK_SECRET_KEY <span className="text-amber-500 ml-2">not set</span></p>
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
    { id: "growth", label: "Content & Growth" },
    { id: "launch", label: "Launch Plan" },
    { id: "investor", label: "Investor Strategy" },
    { id: "product", label: "Product Strategy" },
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
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</Label>
            <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" required className="h-11" />
          </div>
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
