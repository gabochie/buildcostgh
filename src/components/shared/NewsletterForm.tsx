"use client"

import { useState, FormEvent } from "react"
import { Loader2, Check } from "lucide-react"
import { TurnstileWidget } from "@/components/shared/TurnstileWidget"
import { useCsrfFetch } from "@/hooks/useCsrfFetch"

const TURNSTILE_SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || ""

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [turnstileToken, setTurnstileToken] = useState("")
  const csrfFetch = useCsrfFetch()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.includes("@")) return
    setStatus("loading")
    try {
      const res = await csrfFetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      })
      if (res.ok) {
        setStatus("success")
        setEmail("")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
    setTimeout(() => setStatus("idle"), 4000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          className="flex-1 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "success" ? (
            <Check className="h-4 w-4" />
          ) : (
            "Subscribe"
          )}
        </button>
      </div>
      {TURNSTILE_SITEKEY && (
        <TurnstileWidget sitekey={TURNSTILE_SITEKEY} onVerify={setTurnstileToken} />
      )}
    </form>
  )
}
