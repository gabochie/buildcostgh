const PACKAGE_PRICES_USD: Record<string, number> = {
  Basic: 29,
  Detailed: 79,
  Premium: 199,
}

import { fetchGhsRate } from "@/lib/currency"

const RATE_TOLERANCE = 0.02

export function getPackagePriceUsd(packageName: string): number {
  return PACKAGE_PRICES_USD[packageName] ?? 0
}

export function isPaidPackage(packageName: string): boolean {
  return getPackagePriceUsd(packageName) > 0
}

export async function resolvePackageAmount(packageName: string): Promise<number> {
  const usd = getPackagePriceUsd(packageName)
  if (usd <= 0) return 0
  const { rate } = await fetchGhsRate()
  return Math.round(usd * rate)
}

export async function validatePackageAmount(packageName: string, clientAmount: number): Promise<number | null> {
  const usd = getPackagePriceUsd(packageName)
  if (usd <= 0) return null

  const { rate } = await fetchGhsRate()
  const expected = Math.round(usd * rate)
  if (expected <= 0) return null

  const diff = Math.abs(clientAmount - expected) / expected
  if (diff > RATE_TOLERANCE) return null

  return expected
}
