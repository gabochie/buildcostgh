"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, Mail, Phone, Shield } from "lucide-react"
import { SafeEmail } from "@/components/shared/SafeEmail"

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(!reference)

  useEffect(() => {
    if (reference) {
      fetch(`/api/paystack/verify?reference=${reference}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "success") setVerified(true)
        })
        .finally(() => setLoading(false))
    }
  }, [reference])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-6">
          <CheckCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-2">
          Thank you for your purchase!
        </p>
        <p className="text-gray-500 mb-8 text-sm">
          {verified
            ? "Your construction cost report is being generated and will be sent to your email shortly."
            : "Your payment is being processed. You will receive a confirmation email shortly."}
        </p>
        {reference && (
          <p className="text-xs text-gray-400 mb-6">Reference: {reference}</p>
        )}
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button variant="outline">Go Home</Button>
          </Link>
          <Link href="/calculator">
            <Button className="bg-emerald-600 hover:bg-emerald-700">New Calculation</Button>
          </Link>
        </div>

        <div className="mt-10 p-5 rounded-xl bg-gray-50 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Need Help?</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-600" />
              <SafeEmail email="info@buildcostgh.com" className="hover:text-emerald-600" />
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-emerald-600" />
              <a href="tel:+233539364716" className="hover:text-emerald-600">+233 53 936 4716</a>
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
              <Shield className="h-3.5 w-3.5" /> Your payment is secured by Paystack
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
}
