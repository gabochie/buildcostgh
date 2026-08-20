"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react"

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Blog Post Error]", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-heading font-bold text-charcoal mb-2">
          Article Not Found
        </h2>
        <p className="text-gray-600 mb-6">
          This article may have been moved or is temporarily unavailable.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/blog" className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>
          <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors">
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </div>
      </div>
    </div>
  )
}
