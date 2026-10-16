"use client"

import { useEffect } from "react"
import { captureError } from "@/lib/observe"

// Root layout crash handler. Must render its own <html>/<body> because the
// root layout itself failed. Never renders raw error internals.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Global Error]", error instanceof Error ? { message: error.message, digest: error.digest, stack: error.stack } : error)
    void captureError(error, { scope: "global-error" })
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 16,
            textAlign: "center",
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", maxWidth: 420, margin: 0 }}>
            {error.digest
              ? `The page failed to load (ref ${error.digest}). Please try again or contact support with this reference.`
              : "The page failed to load. Please try again."}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={reset}
              style={{
                padding: "10px 20px",
                background: "#059669",
                color: "#fff",
                border: 0,
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => {
                window.location.href = "/"
              }}
              style={{
                padding: "10px 20px",
                border: "1px solid #d1d5db",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              Back Home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
