import Link from "next/link"
import { Hammer, Mail, Phone, MapPin } from "lucide-react"
import { NewsletterForm } from "@/components/shared/NewsletterForm"

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/authors", label: "Authors" },
  { href: "/careers", label: "Careers" },
  { href: "/csr", label: "CSR & Flood Relief" },
  { href: "/investors", label: "Investors" },
  { href: "/affiliates", label: "Affiliates" },
  { href: "/press-kit", label: "Press Kit" },
]

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/calculator", label: "Calculator" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contractors", label: "Contractors" },
  { href: "/flood-safe-land", label: "Flood Safe Land" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

const services = [
  { href: "/services/cost-estimation", label: "Cost Estimation" },
  { href: "/services/pdf-reports", label: "PDF Reports" },
  { href: "/services/excel-spreadsheets", label: "Excel Spreadsheets" },
  { href: "/services/contractor-contacts", label: "Contractor Contacts" },
  { href: "/services/consultation", label: "Consultation" },
  { href: "/services/project-monitoring", label: "Project Monitoring" },
]

const developerLinks = [
  { href: "/api-docs", label: "API Docs" },
  { href: "/api-pricing", label: "API Pricing" },
  { href: "/api-docs", label: "Quick Start" },
]

const socialLinks = [
  { href: "https://web.facebook.com/people/BuildCost-GH/61574509482284/", label: "Facebook", icon: "facebook" },
  { href: "https://x.com/BuildCostGH", label: "X (Twitter)", icon: "x" },
  { href: "https://www.instagram.com/buildcostgh/", label: "Instagram", icon: "instagram" },
  { href: "https://www.linkedin.com/company/buildcost-gh", label: "LinkedIn", icon: "linkedin" },
  { href: "https://www.youtube.com/@BuildCostGH", label: "YouTube", icon: "youtube" },
  { href: "https://www.tiktok.com/@buildcostgh", label: "TikTok", icon: "tiktok" },
]

function SocialIcon({ type }: { type: string }) {
  switch (type) {
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      )
    case "x":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      )
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      )
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      )
    default:
      return null
  }
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-xl text-white mb-4">
              <Hammer className="h-6 w-6 text-emerald-400" />
              BuildCost GH
            </div>
            <p className="text-sm leading-relaxed mb-4">
              The leading construction cost estimation platform for Ghanaians and the global African diaspora. Plan your
              dream home or real estate investment with accurate, real-time cost data.
            </p>
            <div className="space-y-2 text-sm">
              <a href="mailto:info@buildcostgh.com" className="flex items-center gap-2 hover:text-emerald-400">
                <Mail className="h-4 w-4" /> info@buildcostgh.com
              </a>
              <a href="tel:+233539364716" className="flex items-center gap-2 hover:text-emerald-400">
                <Phone className="h-4 w-4" /> +233 53 936 4716
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Lashibi, Tema, Ghana
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              {services.map((service) => (
                <li key={service.label}>
                  <Link href={service.href} className="hover:text-emerald-400 transition-colors">
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Developers</h3>
            <ul className="space-y-2 text-sm">
              {developerLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Newsletter</h3>
            <p className="text-sm mb-3">Get construction tips and cost updates.</p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} BuildCost GH. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
            <Link href="/privacy" className="hover:text-emerald-400">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-emerald-400">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-emerald-400">Cookie Policy</Link>
            <Link href="/refund" className="hover:text-emerald-400">Refund Policy</Link>
            <Link href="/disclaimer" className="hover:text-emerald-400">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
