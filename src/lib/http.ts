import { NextResponse } from "next/server"

const DEFAULT_TIMEOUT_MS = 15000

/**
 * fetch with an enforced timeout and a descriptive error on non-2xx.
 *
 * Upstream payment providers must never be allowed to hang the function and
 * burn the whole platform timeout. AbortSignal.timeout aborts the request if
 * the provider does not respond in time, surfacing a clear message for the
 * queue retry/backoff logic to act on.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.toLowerCase().includes("timeout") || (error as { name?: string }).name === "TimeoutError") {
      throw new Error(`Upstream request timed out after ${timeoutMs}ms: ${url}`)
    }
    throw error
  }
}

/**
 * Fetch a JSON response with a timeout and an explicit non-2xx check. Throws a
 * descriptive error on failure rather than letting `response.json()` throw an
 * opaque parse error on an HTML error page.
 */
export async function fetchJson<T = unknown>(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const response = await fetchWithTimeout(url, init, timeoutMs)
  if (!response.ok) {
    const body = await response.text().catch(() => "")
    throw new Error(`Upstream returned ${response.status} for ${url}: ${body.slice(0, 500)}`)
  }
  return (await response.json()) as T
}

/** Convenience 429 response for rejected requests. */
export function tooManyRequests(message: string, retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  )
}
