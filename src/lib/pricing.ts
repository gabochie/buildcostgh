const PACKAGE_PRICES_USD: Record<string, number> = {
  Basic: 29,
  Detailed: 79,
  Premium: 199,
}

const DEFAULT_RATE = 15.5
const RATE_TOLERANCE = 0.02
let cachedRate: number | null = null
let cachedAt = 0
const CACHE_MS = 5 * 60 * 1000

async function fetchGhsRate(): Promise<number> {
  const now = Date.now()
  if (cachedRate && now - cachedAt < CACHE_MS) return cachedRate

  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=GHS", {
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      const data = await res.json()
      const rate = Number(data?.rates?.GHS)
      if (rate && rate > 0) {
        cachedRate = rate
        cachedAt = now
        return rate
      }
    }
  } catch {}

  return DEFAULT_RATE
}

export function getPackagePriceUsd(packageName: string): number {
  return PACKAGE_PRICES_USD[packageName] ?? 0
}

export function isPaidPackage(packageName: string): boolean {
  return getPackagePriceUsd(packageName) > 0
}

export async function resolvePackageAmount(packageName: string): Promise<number> {
  const usd = getPackagePriceUsd(packageName)
  if (usd <= 0) return 0
  const rate = await fetchGhsRate()
  return Math.round(usd * rate)
}

export async function validatePackageAmount(packageName: string, clientAmount: number): Promise<number | null> {
  const usd = getPackagePriceUsd(packageName)
  if (usd <= 0) return null

  const rate = await fetchGhsRate()
  const expected = Math.round(usd * rate)
  if (expected <= 0) return null

  const diff = Math.abs(clientAmount - expected) / expected
  if (diff > RATE_TOLERANCE) return null

  return expected
}
