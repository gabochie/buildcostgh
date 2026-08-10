import { prisma } from "./prisma"

// The proxy middleware checks maintenance mode on EVERY request.
// Cache the value in-memory (30s TTL) so we don't hit the DB per request.
const CACHE_TTL_MS = 30_000

let cachedEnabled: boolean | null = null
let cachedAt = 0

export async function isMaintenanceMode(): Promise<boolean> {
  if (cachedEnabled !== null && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedEnabled
  }
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "maintenanceMode" } })
    cachedEnabled = setting?.value === "true"
    cachedAt = Date.now()
    return cachedEnabled
  } catch {
    // Keep the last known value on DB failure; default to live if never fetched
    return cachedEnabled ?? false
  }
}

export function invalidateMaintenanceCache(): void {
  cachedEnabled = null
  cachedAt = 0
}

export async function setMaintenanceMode(enabled: boolean): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: "maintenanceMode" },
    update: { value: enabled ? "true" : "false" },
    create: { key: "maintenanceMode", value: enabled ? "true" : "false" },
  })
  invalidateMaintenanceCache()
}
