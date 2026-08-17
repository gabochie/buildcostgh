"use client"

import { useState } from "react"

export function HelpfulWidget() {
  const [voted, setVoted] = useState<"yes" | "no" | null>(null)

  return (
    <div className="mt-8 p-5 rounded-xl bg-white border border-gray-200 text-center">
      <p className="text-sm font-medium text-gray-700 mb-3">Was this article helpful?</p>
      <div className="flex items-center justify-center gap-3">
        {voted === null ? (
          <>
            <button
              type="button"
              onClick={() => setVoted("yes")}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              Yes, very helpful
            </button>
            <button
              type="button"
              onClick={() => setVoted("no")}
              className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Needs improvement
            </button>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            {voted === "yes" ? "Thanks for your feedback!" : "Noted — we will improve this."}
          </p>
        )}
      </div>
    </div>
  )
}
