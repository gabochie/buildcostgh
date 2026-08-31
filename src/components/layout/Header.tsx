"use client"

import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Menu, X, Phone, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" },
  { href: "/costs", label: "Costs by Region" },
  { href: "/building-types/residential", label: "Building Types" },
  { href: "/pricing", label: "Pricing" },
  { href: "/services", label: "Services" },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/brand/logo.png"
            alt="BuildCostGh"
            width={48}
            height={48}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <LanguageSwitcher />
          <a href="tel:+233539364716" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-600">
            <Phone className="h-4 w-4" />
            <span>+233 53 936 4716</span>
          </a>
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-emerald text-white border-0">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-emerald-700 transition-colors">
                Sign In
              </Link>
              <Link href="/calculator">
                <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-emerald text-white border-0">
                  Start Calculating
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-charcoal p-2"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div
        ref={menuRef}
        className={cn(
          "md:hidden border-t border-gray-100 bg-white overflow-hidden transition-all duration-200 ease-in-out",
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col gap-3 px-4 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-600 hover:text-emerald-700 py-2"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-emerald-700 hover:text-emerald-600 py-2">
              <LayoutDashboard className="h-4 w-4 inline mr-1.5" /> My Dashboard
            </Link>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)} className="text-sm font-medium text-emerald-700 hover:text-emerald-600 py-2">
              Sign In
            </Link>
          )}
          <Link href="/calculator" onClick={() => setOpen(false)}>
            <Button className="w-full bg-gradient-primary text-white border-0">Start Calculating</Button>
          </Link>
          <div className="pt-2 border-t border-gray-100">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </header>
  )
}
