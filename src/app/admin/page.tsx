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
      setError("Invalid email or password")
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
