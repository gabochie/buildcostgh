"use client"

import { useEffect } from "react"

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV === "development") return
    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
        // Prompt on update: reload-safe — only auto-update, UI toast optional.
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing
          if (!worker) return
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              window.dispatchEvent(new CustomEvent("bcgh:sw-updated"))
            }
          })
        })
      } catch {
        // SW registration failure must never break the app.
      }
    }
    // Delay to keep TTI clean.
    const t = setTimeout(register, 3000)
    return () => clearTimeout(t)
  }, [])

  return null
}
