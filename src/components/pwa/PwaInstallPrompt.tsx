"use client"

import { useEffect, useState } from "react"
import { Download, X, RefreshCw } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("bcgh-pwa-dismissed") === "1",
  )
  const [standalone] = useState(() => typeof window !== "undefined" && isStandalone())
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    if (standalone || dismissed) return
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onUpdated = () => setUpdated(true)
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("bcgh:sw-updated", onUpdated)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("bcgh:sw-updated", onUpdated)
    }
  }, [standalone, dismissed])

  const dismiss = () => {
    localStorage.setItem("bcgh-pwa-dismissed", "1")
    setDismissed(true)
    setDeferred(null)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === "accepted") setDeferred(null)
    else dismiss()
  }

  if (updated) {
    return (
      <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-gray-900 text-white shadow-2xl max-w-[calc(100vw-2rem)]">
        <RefreshCw className="h-4 w-4 text-emerald-300" />
        <p className="text-sm">A new version is available.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-500 min-h-[44px]"
        >
          Refresh
        </button>
      </div>
    )
  }

  if (!deferred || dismissed || standalone) return null

  return (
    <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-gray-900 text-white shadow-2xl max-w-[calc(100vw-2rem)]">
      <Download className="h-4 w-4 text-emerald-300 flex-shrink-0" />
      <p className="text-sm whitespace-nowrap">Install the BuildCost app?</p>
      <button
        onClick={install}
        className="px-4 py-2 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-500 min-h-[44px]"
      >
        Install
      </button>
      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="p-2.5 rounded-xl hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
