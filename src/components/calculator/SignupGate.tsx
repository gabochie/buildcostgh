"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, UserPlus, Lock, AlertCircle, FileText, MapPin, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { PasswordField } from "@/components/shared/PasswordField"
import { useCsrfFetch } from "@/hooks/useCsrfFetch"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignupGate({ defaultEmail }: { defaultEmail?: string }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState(defaultEmail || "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const csrfFetch = useCsrfFetch()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!name.trim()) {
      setError("Full name is required")
      return
    }
    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      const res = await csrfFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })

      if (res.status === 409) {
        setError("An account with this email already exists. Please sign in.")
        setLoading(false)
        return
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setLoading(false)
        return
      }

      const signInRes = await signIn("credentials", { email: email.trim(), password, redirect: false })
      if (signInRes?.error) {
        setError("Account created — please sign in to continue.")
        setLoading(false)
        return
      }

      toast.success("Account created — your estimate is unlocked!")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary text-white flex items-center justify-center mx-auto mb-4">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Unlock Your Free Estimate</h2>
        <p className="text-sm text-gray-500">Create a free account to see your full cost breakdown</p>
      </div>

      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 space-y-2">
        <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium">
          <FileText className="h-4 w-4 flex-shrink-0" /> Full itemised cost breakdown
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium">
          <MapPin className="h-4 w-4 flex-shrink-0" /> Compare costs across regions
        </div>
        <div className="flex items-center gap-2 text-sm text-emerald-800 font-medium">
          <ShieldCheck className="h-4 w-4 flex-shrink-0" /> Save &amp; access estimates anytime
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gate-name">Full Name</Label>
          <Input
            id="gate-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            autoComplete="name"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gate-email">Email</Label>
          <Input
            id="gate-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoComplete="email"
            className="h-11"
          />
        </div>
        <PasswordField
          id="gate-password"
          label="Password"
          value={password}
          onChange={setPassword}
        />

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-gradient-primary text-white border-0 hover:opacity-90 shadow-glow-emerald"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Create Account &amp; View Estimate
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login?callbackUrl=/calculator" className="font-semibold text-emerald-600 hover:text-emerald-700">
          Sign in
        </Link>
      </p>

      <p className="text-center text-[11px] text-gray-400">
        Free forever. No payment details required. Unsubscribe anytime.
      </p>
    </div>
  )
}
