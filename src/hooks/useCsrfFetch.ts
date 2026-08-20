"use client"

import { useCallback, useRef } from "react"

let cachedToken: string | null = null

async function fetchCsrfToken(): Promise<string> {
  if (cachedToken) return cachedToken
  try {
    const res = await fetch("/api/csrf")
    if (res.ok) {
      const data = await res.json()
      cachedToken = data.csrfToken
      return cachedToken!
    }
  } catch { /* CSRF fetch failed — request will be rejected by middleware */ }
  return ""
}

/**
 * Hook that provides a fetch wrapper with CSRF token automatically included.
 * Usage: const csrfFetch = useCsrfFetch(); await csrfFetch("/api/...", { method: "POST", ... })
 */
export function useCsrfFetch() {
  const tokenRef = useRef<string | null>(null)

  const csrfFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    if (!tokenRef.current) {
      tokenRef.current = await fetchCsrfToken()
    }

    const headers = new Headers(init?.headers)
    if (tokenRef.current) {
      headers.set("x-csrf-token", tokenRef.current)
    }

    const res = await fetch(url, { ...init, headers })

    // If CSRF rejected, refresh token and retry once
    if (res.status === 403) {
      cachedToken = null
      tokenRef.current = await fetchCsrfToken()
      if (tokenRef.current) {
        const retryHeaders = new Headers(init?.headers)
        retryHeaders.set("x-csrf-token", tokenRef.current)
        return fetch(url, { ...init, headers: retryHeaders })
      }
    }

    return res
  }, [])

  return csrfFetch
}
