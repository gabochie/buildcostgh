"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Home, MapPin, Calculator, HardHat, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const { status } = useSession()
  const accountHref = status === "authenticated" ? "/dashboard" : "/login"

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/costs", label: "Costs", icon: MapPin, active: pathname.startsWith("/costs") },
    {
      href: "/calculator",
      label: "Calculate",
      icon: Calculator,
      active: pathname.startsWith("/calculator"),
      fab: true,
    },
    {
      href: "/contractors",
      label: "Pros",
      icon: HardHat,
      active: pathname.startsWith("/contractors"),
    },
    {
      href: accountHref,
      label: "Account",
      icon: User,
      active: pathname.startsWith("/dashboard") || pathname.startsWith("/login"),
    },
  ]

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="grid grid-cols-5 items-stretch">
        {tabs.map(({ href, label, icon: Icon, active, fab }) => (
          <li key={href + label}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 min-h-[60px] min-w-[64px] py-2 text-[11px] font-medium transition-colors",
                active ? "text-emerald-700" : "text-gray-500 hover:text-gray-900",
              )}
            >
              {fab ? (
                <span
                  className={cn(
                    "-mt-7 mb-0.5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg border-4 border-white transition-colors",
                    active ? "bg-emerald-700 text-white" : "bg-emerald-600 text-white",
                  )}
                >
                  <Icon className="h-6 w-6" />
                </span>
              ) : (
                <Icon className="h-6 w-6" />
              )}
              <span>{label}</span>
              {active && !fab && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-emerald-600" aria-hidden />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
