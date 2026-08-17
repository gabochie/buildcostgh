"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Hammer, Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { TurnstileWidget } from "@/components/shared/TurnstileWidget"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TURNSTILE_SITEKEY = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY || ""

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetUrl, setResetUrl] = useState("")
  const [error, setError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!EMAIL_RE.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }
      setSent(true)
      if (data.resetUrl) setResetUrl(data.resetUrl)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow-emerald">
            <Hammer className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-charcoal">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-glass-lg p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
              <p className="text-sm text-gray-700">
                If an account exists with <strong>{email}</strong>, we&apos;ve sent a password reset link.
              </p>
              <p className="text-xs text-gray-500">
                Check your inbox and follow the link. It expires in 1 hour.
              </p>
              {resetUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                  <p className="font-semibold">Dev mode — reset link:</p>
                  <a href={resetUrl} className="underline break-all text-amber-700 hover:text-amber-900">
                    {resetUrl}
                  </a>
                </div>
              )}
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 mt-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                  className="h-11"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {TURNSTILE_SITEKEY && (
                <TurnstileWidget sitekey={TURNSTILE_SITEKEY} onVerify={setTurnstileToken} />
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-primary text-white border-0 hover:opacity-90 shadow-glow-emerald"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" /> Send Reset Link
                  </>
                )}
              </Button>

              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-11 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
