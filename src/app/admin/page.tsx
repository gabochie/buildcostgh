"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Roadmap } from "@/components/admin/Roadmap"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LogOut, Loader2, ShoppingBag, MessageSquare, Users, Mail, TrendingUp,
  BarChart3, FileText, Eye, ExternalLink, ListChecks, Shield
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

type Stats = {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  totalRevenue: number
  totalMessages: number
  unreadMessages: number
  totalLeads: number
  totalSubscribers: number
}

type Order = {
  id: string
  fullName: string
  email: string
  package: string
  amount: number
  status: string
  reference: string
  reportUrl: string | null
  createdAt: string
}

type ContactMessage = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  createdAt: string
}

type BlogPostItem = {
  id: string
  title: string
  slug: string
  published: boolean
  author: string
  category: string
  createdAt: string
}

type CalculatorLead = {
  id: string
  email: string
  bedrooms: string | null
  location: string | null
  completed: boolean
  createdAt: string
}

type NewsletterSubscriber = {
  id: string
  email: string
  name: string | null
  subscribed: boolean
  createdAt: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const [tab, setTab] = useState<"overview" | "orders" | "messages" | "blog" | "leads" | "newsletter" | "roadmap">("overview")
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
        setStats(s)
        setOrders(o)
        setMessages(m)
        setBlogPosts(b)
        setLeads(l)
        setSubscribers(n)
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

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3, count: null },
    { id: "orders" as const, label: "Orders", icon: ShoppingBag, count: stats?.totalOrders },
    { id: "messages" as const, label: "Messages", icon: MessageSquare, count: stats?.unreadMessages },
    { id: "leads" as const, label: "Leads", icon: Users, count: stats?.totalLeads },
    { id: "newsletter" as const, label: "Newsletter", icon: Mail, count: stats?.totalSubscribers },
    { id: "blog" as const, label: "Blog", icon: FileText, count: blogPosts.length },
    { id: "roadmap" as const, label: "Roadmap", icon: ListChecks, count: null },
  ]

  const toggleMaintenance = async () => {
    setToggling(true)
    try {
      const res = await fetch("/api/admin/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !maintenanceMode }),
      })
      const data = await res.json()
      setMaintenanceMode(data.enabled)
    } catch (e) {
      console.error(e)
    } finally {
      setToggling(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-heading font-bold text-charcoal">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome, {session.user?.name || session.user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map((t) => (
            <Button
              key={t.id}
              variant={tab === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.id)}
              className={tab === t.id ? "bg-emerald-600" : ""}
            >
              <t.icon className="mr-1.5 h-4 w-4" />
              {t.label}
              {t.count !== null && t.count !== undefined && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-white/20">{t.count}</span>
              )}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : tab === "overview" ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Total Revenue" value={formatCurrency(stats?.totalRevenue || 0)} icon={TrendingUp} />
              <StatCard title="Orders" value={String(stats?.totalOrders || 0)} sub={`${stats?.completedOrders || 0} completed`} icon={ShoppingBag} />
              <StatCard title="Messages" value={String(stats?.totalMessages || 0)} sub={`${stats?.unreadMessages || 0} unread`} icon={MessageSquare} />
              <StatCard title="Leads" value={String(stats?.totalLeads || 0)} sub={`${stats?.totalSubscribers || 0} subscribers`} icon={Users} />
            </div>

            <Card className="border-amber-200 bg-amber-50/30">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Maintenance Mode</h3>
                    <p className="text-sm text-gray-500">
                      {maintenanceMode
                        ? "Site is currently in maintenance — visitors see the maintenance page"
                        : "Site is live and accessible to everyone"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleMaintenance}
                  disabled={toggling}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                    maintenanceMode ? "bg-amber-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      maintenanceMode ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-emerald-600" /> Recent Orders
                  </h3>
                  {orders.length === 0 ? (
                    <p className="text-sm text-gray-400">No orders yet</p>
                  ) : (
                    <div className="space-y-2">
                      {orders.slice(0, 5).map((o) => (
                        <div key={o.id} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                          <span className="text-gray-700">{o.fullName} — {o.package}</span>
                          <Badge className={o.status === "completed" ? "bg-emerald-500" : "bg-amber-500"}>
                            {o.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-600" /> Unread Messages
                  </h3>
                  {messages.filter(m => !m.read).length === 0 ? (
                    <p className="text-sm text-gray-400">All caught up!</p>
                  ) : (
                    <div className="space-y-2">
                      {messages.filter(m => !m.read).slice(0, 5).map((m) => (
                        <div key={m.id} className="text-sm py-1.5 border-b border-gray-100 last:border-0">
                          <span className="font-medium text-gray-900">{m.name}</span>
                          <p className="text-gray-500 truncate">{m.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : tab === "orders" ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900">{order.fullName}</p>
                    <p className="text-sm text-gray-500">{order.email} &middot; {order.package} &middot; GHS {order.amount}</p>
                    <p className="text-xs text-gray-400">Ref: {order.reference}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={order.status === "completed" ? "bg-emerald-500" : order.status === "pending" ? "bg-amber-500" : "bg-red-500"}>
                      {order.status}
                    </Badge>
                    {order.reportUrl && (
                      <a href={order.reportUrl} className="block text-xs text-emerald-600 hover:underline mt-1" target="_blank">
                        View Report
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {orders.length === 0 && <p className="text-center text-gray-400 py-8">No orders yet</p>}
          </div>
        ) : tab === "messages" ? (
          <div className="space-y-3">
            {messages.map((msg) => (
              <Card key={msg.id} className={!msg.read ? "border-emerald-200 bg-emerald-50/30" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between mb-1">
                    <p className="font-medium text-gray-900">{msg.name} {!msg.read && <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block ml-1" />}</p>
                    <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-500">{msg.email}</p>
                  {msg.subject && <p className="text-sm font-medium text-gray-700 mt-1">{msg.subject}</p>}
                  <p className="text-sm text-gray-600 mt-2">{msg.message}</p>
                </CardContent>
              </Card>
            ))}
            {messages.length === 0 && <p className="text-center text-gray-400 py-8">No messages yet</p>}
          </div>
        ) : tab === "leads" ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-gray-900">{leads.length}</p>
                <p className="text-sm text-gray-500">Total Leads Captured</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-gray-900">{leads.filter(l => l.completed).length}</p>
                <p className="text-sm text-gray-500">Completed Calculations</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-gray-900">{leads.filter(l => !l.completed).length}</p>
                <p className="text-sm text-gray-500">Abandoned (needs nurture)</p>
              </div>
            </div>
            {leads.map((lead) => (
              <Card key={lead.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900">{lead.email}</p>
                    <p className="text-sm text-gray-500">
                      {lead.location || "No location"} &middot; {lead.bedrooms || "?"} bed
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>{new Date(lead.createdAt).toLocaleDateString()}</p>
                    <Badge className={lead.completed ? "bg-emerald-500" : "bg-amber-500"}>
                      {lead.completed ? "Completed" : "Abandoned"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {leads.length === 0 && <p className="text-center text-gray-400 py-8">No leads captured yet</p>}
          </div>
        ) : tab === "newsletter" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-gray-900">{subscribers.length}</p>
                <p className="text-sm text-gray-500">Total Subscribers</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-gray-900">{subscribers.filter(s => s.subscribed).length}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-2xl font-bold text-gray-900">{subscribers.filter(s => !s.subscribed).length}</p>
                <p className="text-sm text-gray-500">Unsubscribed</p>
              </div>
            </div>
            {subscribers.map((sub) => (
              <Card key={sub.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900">{sub.email}</p>
                    <p className="text-sm text-gray-500">
                      Subscribed {new Date(sub.createdAt).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                  <Badge className={sub.subscribed ? "bg-emerald-500" : "bg-gray-400"}>
                    {sub.subscribed ? "Active" : "Unsubscribed"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {subscribers.length === 0 && <p className="text-center text-gray-400 py-8">No subscribers yet</p>}
          </div>
        ) : tab === "roadmap" ? (
          <Roadmap />
        ) : tab === "blog" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Link href="/admin/blog/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">New Post</Button>
              </Link>
            </div>
            {blogPosts.map((post) => (
              <Card key={post.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-gray-900">{post.title}</p>
                    <p className="text-sm text-gray-500">
                      /blog/{post.slug} &middot; by {post.author} &middot; {post.category?.replace(/-/g, " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={post.published ? "bg-emerald-500" : "bg-gray-400"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                    <div className="flex gap-1">
                      <Link href={`/admin/blog/${post.id}`}>
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                      </Link>
                      <Link href={post.published ? `/blog/${post.slug}` : `/blog/preview/${post.slug}`} target="_blank">
                        <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {blogPosts.length === 0 && <p className="text-center text-gray-400 py-8">No blog posts yet</p>}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loggingIn, setLoggingIn] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoggingIn(true)
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    setLoggingIn(false)
    if (res?.error) {
      setError("Invalid email or password")
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-6">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-heading font-bold text-charcoal">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your store</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loggingIn} className="w-full bg-gradient-primary text-white border-0">
          {loggingIn ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : "Sign In"}
        </Button>
      </form>
    </div>
  )
}

function StatCard({ title, value, sub, icon: Icon }: { title: string; value: string; sub?: string; icon: any }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
