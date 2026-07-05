"use client"

import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard, ShoppingBag, MessageSquare, Users, Mail,
  FileText, ListChecks, Settings, LogOut, Menu, X, Loader2, Hammer,   Lightbulb, Network,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin?tab=orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin?tab=messages", label: "Messages", icon: MessageSquare },
  { href: "/admin?tab=leads", label: "Leads", icon: Users },
  { href: "/admin?tab=newsletter", label: "Newsletter", icon: Mail },
  { href: "/admin?tab=blog", label: "Blog", icon: FileText },
  { href: "/admin?tab=roadmap", label: "Roadmap", icon: ListChecks },
  { href: "/admin?tab=ecosystem", label: "Ecosystem", icon: Network },
  { href: "/admin?tab=strategy", label: "Strategy", icon: Lightbulb },
  { href: "/admin?tab=settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchParams, setSearchParams] = useState("")

  useEffect(() => { setSearchParams(window.location.search) }, [])

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/admin") {
      router.replace("/admin")
    }
  }, [status, pathname, router])

  const isLoginPage = pathname === "/admin" && !session
  const currentTab = new URLSearchParams(searchParams).get("tab") || "overview"

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) return pathname === item.href && !searchParams.includes("tab")
    const tab = new URLSearchParams(item.href.split("?")[1]).get("tab")
    if (tab) return tab === currentTab
    return pathname.startsWith(item.href.split("?")[0])
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (isLoginPage || status === "unauthenticated") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 text-white flex flex-col
        transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="px-6 h-16 flex items-center border-b border-slate-700/50">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Hammer className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">BuildCostGH</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive(item)
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name || "Admin"}</p>
              <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden h-16 bg-white border-b flex items-center px-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-600">
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-semibold text-sm text-slate-900">BuildCostGH Admin</span>
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
