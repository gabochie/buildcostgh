/**
 * Real-time USD → GHS exchange rate.
 *
 * Frankfurter (previously used) only covers ~30 ECB-reference currencies and
 * does NOT include GHS, so the app silently fell back to a stale hardcoded
 * rate. We now use open.er-api.com (ExchangeRate-API's free open endpoint —
 * no API key, no CORS restrictions, supports GHS) with Coinbase's public
 * rate endpoint as a fallback.
 *
 * Both APIs are free and open; no secrets required.
 */

export interface RateResult {
  rate: number
  /** ISO date (YYYY-MM-DD) or "" when unknown */
  date: string
}

const DEFAULT_RATE = 15.5
const CACHE_MS = 5 * 60 * 1000

let cached: RateResult | null = null
let cachedAt = 0

async function fetchFrom(url: string, pick: (data: any) => { rate?: number; date?: string }): Promise<RateResult | null> {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
  if (!res.ok) return null
  const data = await res.json()
  const picked = pick(data)
  const rate = Number(picked?.rate)
  if (!Number.isFinite(rate) || rate <= 0) return null
  return { rate, date: picked?.date || "" }
}

const SOURCES: Array<() => Promise<RateResult | null>> = [
  () =>
    fetchFrom("https://open.er-api.com/v6/latest/USD", (d) => ({
      rate: d?.rates?.GHS,
      date: d?.time_last_update_utc ? String(d.time_last_update_utc).slice(0, 10) : "",
    })),
  () =>
    fetchFrom("https://api.coinbase.com/v2/exchange-rates?currency=USD", (d) => ({
      rate: d?.data?.rates?.GHS,
    })),
]

/** Server-side: fetch (and cache) the current USD→GHS rate. Never throws. */
export async function fetchGhsRate(): Promise<RateResult> {
  const now = Date.now()
  if (cached && now - cachedAt < CACHE_MS) return cached

  for (const source of SOURCES) {
    try {
      const result = await source()
      if (result) {
        cached = result
        cachedAt = now
        return result
      }
    } catch {
      // try next source
    }
  }

  return cached ?? { rate: DEFAULT_RATE, date: "" }
}

/** Client-safe wrapper for React components (pricing page, admin audit). */
export async function getClientGhsRate(): Promise<RateResult> {
  return fetchGhsRate()
}

/** Clear the cached rate (used by tests to force a fresh fetch). */
export function resetGhsRateCache(): void {
  cached = null
  cachedAt = 0
}
