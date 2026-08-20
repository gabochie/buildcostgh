"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Hammer, Loader2, UserPlus, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { PasswordField } from "@/components/shared/PasswordField"
import { toast } from "sonner"
import { useCsrfFetch } from "@/hooks/useCsrfFetch"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const csrfFetch = useCsrfFetch()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.name.trim()) {
      setError("Full name is required")
      return
    }
    if (!EMAIL_RE.test(form.email)) {
      setError("Please enter a valid email address")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await csrfFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          password: form.password,
        }),
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

      const signInRes = await signIn("credentials", {
        email: form.email.trim(),
        password: form.password,
        redirect: false,
      })

      if (signInRes?.error) {
        router.push("/login?registered=1")
      } else {
        toast.success("Account created — welcome to BuildCost GH!")
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

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
          <h1 className="text-3xl font-heading font-bold text-charcoal">Create Your Account</h1>
          <p className="text-sm text-gray-500 mt-1">Free to join — track estimates, orders, and reports in one place.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 shadow-glass-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signup-name">Full Name</Label>
            <Input
              id="signup-name"
              value={form.name}
              onChange={set("name")}
              placeholder="Your name"
              required
              autoComplete="name"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-phone">Phone (optional)</Label>
            <Input
              id="signup-phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="+233 XX XXX XXXX"
              autoComplete="tel"
              className="h-11"
            />
          </div>
          <PasswordField
            id="signup-password"
            label="Password"
            value={form.password}
            onChange={(v) => setForm((f) => ({ ...f, password: v }))}
          />
          <PasswordField
            id="signup-confirm"
            label="Confirm Password"
            value={form.confirm}
            onChange={(v) => setForm((f) => ({ ...f, confirm: v }))}
            placeholder="Repeat your password"
            showGenerate={false}
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
                <UserPlus className="mr-2 h-4 w-4" /> Create Account
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
