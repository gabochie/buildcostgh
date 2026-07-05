"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ArrowRight, Download, Shield } from "lucide-react"
import Link from "next/link"

const STORAGE_KEY = "bcg-exit-shown"
const MIN_VISIT_MS = 15000

export function ExitIntentPopup() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(STORAGE_KEY)
    if (alreadyShown) return

    let mounted = true
    const minTimer = setTimeout(() => {
      if (!mounted) return
      setDismissed(false)

      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY > 0) return
        if (!mounted) return
        setVisible(true)
        sessionStorage.setItem(STORAGE_KEY, "1")
      }

      document.addEventListener("mouseleave", handleMouseLeave)
      return () => {
        document.removeEventListener("mouseleave", handleMouseLeave)
      }
    }, MIN_VISIT_MS)

    return () => {
      mounted = false
      clearTimeout(minTimer)
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    setDismissed(true)
    sessionStorage.setItem(STORAGE_KEY, "1")
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-charcoal p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur border border-white/10">
            <Download className="h-8 w-8 text-gold" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Before You Go...
          </h2>
          <p className="text-emerald-100/70 text-sm leading-relaxed">
            Get your <strong className="text-gold">FREE Construction Cost Guide</strong> — learn how to budget, save money, and avoid costly mistakes when building in Ghana.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>Sample budget breakdowns for 1, 2, 3 &amp; 4-bedroom homes</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>Regional cost comparisons across all 16 regions of Ghana</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <Shield className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>Diaspora-specific tips for remote project management</span>
          </div>

          <Link
            href="/calculator"
            onClick={handleDismiss}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-primary text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-emerald-200"
          >
            Get Your Free Estimate <ArrowRight className="h-4 w-4" />
          </Link>

          <p className="text-[10px] text-gray-400 text-center">
            Free PDF &middot; No spam &middot; Unsubscribe anytime
          </p>
        </div>
      </div>
    </div>
  )
}
