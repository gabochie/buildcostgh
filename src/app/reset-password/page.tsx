"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Hammer, Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordField } from "@/components/shared/PasswordField"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!token || token.length !== 64) {
      setError("Invalid reset link")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong")
        return
      }
      setDone(true)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!token || token.length !== 64) {
    return (
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
        <p className="text-sm text-gray-700">Invalid reset link.</p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center w-full h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Request a new link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
        <p className="text-sm text-gray-700">Your password has been reset.</p>
        <Button
          className="w-full h-11 bg-gradient-primary text-white border-0 hover:opacity-90 shadow-glow-emerald"
          onClick={() => router.push("/login")}
        >
          Sign In
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        id="reset-password"
        label="New Password"
        value={password}
        onChange={setPassword}
        placeholder="At least 8 characters"
        autoComplete="new-password"
        showGenerate
      />
      <PasswordField
        id="reset-confirm"
        label="Confirm Password"
        value={confirm}
        onChange={setConfirm}
        placeholder="Re-enter your password"
        autoComplete="new-password"
        showGenerate={false}
      />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-gradient-primary text-white border-0 hover:opacity-90 shadow-glow-emerald"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>

      <Link
        href="/login"
        className="inline-flex items-center justify-center w-full h-11 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
      </Link>
    </form>
  )
}

export default function ResetPasswordPage() {
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
          <h1 className="text-3xl font-heading font-bold text-charcoal">New Password</h1>
          <p className="text-sm text-gray-500 mt-1">Enter your new password below.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-glass-lg p-6">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  )
}
