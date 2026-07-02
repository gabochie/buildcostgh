"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, Hammer, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" },
  { href: "/pricing", label: "Pricing" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Hammer className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading font-bold text-xl text-charcoal">
            Build<span className="text-emerald-600">Cost</span> GH
          </span>
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
          <a href="tel:+233539364716" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-600">
            <Phone className="h-4 w-4" />
            <span>+233 53 936 4716</span>
          </a>
          <Link href="/calculator">
            <Button className="bg-gradient-primary hover:opacity-90 shadow-glow-emerald text-white border-0">
              Start Calculating
            </Button>
          </Link>
        </div>

        <button className="md:hidden text-charcoal" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4">
          <nav className="flex flex-col gap-3">
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
            <Link href="/calculator" onClick={() => setOpen(false)}>
              <Button className="w-full bg-gradient-primary text-white border-0">Start Calculating</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
