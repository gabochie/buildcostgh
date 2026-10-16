"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff, X } from "lucide-react"

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4)
  const raw = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  const bytes = window.atob(raw)
  return Uint8Array.from([...bytes].map((c) => c.charCodeAt(0)))
}

export function PushPrompt() {
  const [supported] = useState(
    () =>
      typeof window !== "undefined" &&
      "Notification" in window &&
      "serviceWorker" in navigator &&
      "PushManager" in window,
  )
  const [permission, setPermission] = useState<NotificationPermission | null>(
    () => (typeof window !== "undefined" && "Notification" in window ? Notification.permission : null),
  )
  const [subscribed, setSubscribed] = useState(false)
  const [dismissed, setDismissed] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!supported) return
    if (typeof window !== "undefined" && localStorage.getItem("bcgh-push-dismissed") === "1") return
    // Only nudge: show when permission not yet decided and not already subscribed.
    // State updates below happen in async callbacks, not synchronously in the effect.
    let timer: ReturnType<typeof setTimeout> | undefined
    navigator.serviceWorker.ready
      .then(async (reg) => {
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          setSubscribed(true)
          return
        }
        if (Notification.permission === "default") {
          timer = setTimeout(() => setDismissed(false), 20000)
        }
      })
      .catch(() => {})
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subscribe = async () => {
    setBusy(true)
    try {
      const keyRes = await fetch("/api/push/public-key")
      if (!keyRes.ok) {
        // Push not configured server-side — dismiss quietly.
        setDismissed(true)
        return
      }
      const { publicKey } = await keyRes.json()
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") {
        setDismissed(true)
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const json = sub.toJSON()
      let csrfToken = ""
      try {
        const csrfRes = await fetch("/api/csrf")
        if (csrfRes.ok) csrfToken = ((await csrfRes.json()) as { csrfToken?: string }).csrfToken || ""
      } catch {
        // CSRF fetch failed — the subscribe request will be rejected server-side.
      }
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": csrfToken } : {}) },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
      setSubscribed(true)
      setDismissed(true)
    } catch {
      setDismissed(true)
    } finally {
      setBusy(false)
    }
  }

  const dismiss = () => {
    localStorage.setItem("bcgh-push-dismissed", "1")
    setDismissed(true)
  }

  if (!supported || dismissed || subscribed || permission === "denied") return null

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 max-w-xs rounded-2xl bg-white border border-gray-200 shadow-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Bell className="h-5 w-5 text-emerald-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Price-drop alerts</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Get notified when material rates change in your region.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={subscribe}
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
            >
              {busy ? "Enabling…" : "Enable"}
            </button>
            <button
              onClick={dismiss}
              aria-label="Dismiss push prompt"
              className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <span className="sr-only">
        <BellOff className="h-4 w-4" />
      </span>
    </div>
  )
}
