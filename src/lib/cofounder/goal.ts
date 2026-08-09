import { prisma } from "@/lib/prisma"
import { getPackagePriceUsd } from "@/lib/pricing"
import type { CofounderGoal, CofounderTask } from "@prisma/client"

export const DEFAULT_GOAL_TARGET_USD = 1_000_000
export const DEFAULT_GOAL_PERIOD_DAYS = 365

export type MonthlyRevenue = { month: string; revenueUsd: number }

export type GoalProgress = {
  revenueUsd: number
  percentComplete: number
  daysElapsed: number
  daysTotal: number
  daysRemaining: number
  paceUsdPerDay: number
  requiredUsdPerDay: number
  onTrack: boolean
  forecastUsd: number
  monthlyRevenue: MonthlyRevenue[]
}

/**
 * Active goal or null. Ordered by creation so the most recently created
 * "active" goal wins.
 */
export async function getActiveGoal(): Promise<CofounderGoal | null> {
  return prisma.cofounderGoal.findFirst({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Ensure a goal exists. If no active goal is present, seeds the default
 * $1M USD / 12 month mission and returns it. This keeps the cofounder
 * panel usable before the founder ever touches the admin UI.
 */
export async function ensureGoal(): Promise<CofounderGoal> {
  const existing = await getActiveGoal()
  if (existing) return existing

  const now = new Date()
  const end = new Date(now.getTime() + DEFAULT_GOAL_PERIOD_DAYS * 24 * 60 * 60 * 1000)

  return prisma.cofounderGoal.create({
    data: {
      title: "Reach $1M USD revenue in 12 months",
      description:
        "Core mission: take BuildCostGH from current revenue to $1,000,000 USD annualized within 12 months by growing paid report sales, contractor marketplace revenue, and diaspora subscriptions.",
      targetAmount: DEFAULT_GOAL_TARGET_USD,
      currency: "USD",
      periodStart: now,
      periodEnd: end,
      status: "active",
    },
  })
}

/**
 * Recognized revenue = sum of USD package prices for completed orders.
 * Uses PACKAGE_PRICES_USD as the source of truth (Free Trial = $0) so the
 * figure is deterministic regardless of the GHS rate at payment time.
 */
export async function computeRevenueUsd(): Promise<{
  totalUsd: number
  monthlyRevenue: MonthlyRevenue[]
}> {
  const orders = await prisma.order.findMany({
    where: { status: "completed" },
    select: { package: true, createdAt: true },
  })

  let totalUsd = 0
  const byMonth = new Map<string, number>()

  for (const order of orders) {
    const usd = getPackagePriceUsd(order.package)
    totalUsd += usd
    const key = order.createdAt.toISOString().slice(0, 7) // YYYY-MM
    byMonth.set(key, (byMonth.get(key) ?? 0) + usd)
  }

  const monthlyRevenue = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenueUsd]) => ({ month, revenueUsd }))

  return { totalUsd, monthlyRevenue }
}

/**
 * Progress of the current goal: % complete, pace vs required, on-track
 * forecast. All math is day-based against the goal's period window.
 */
export async function computeGoalProgress(goal: CofounderGoal): Promise<GoalProgress> {
  const { totalUsd, monthlyRevenue } = await computeRevenueUsd()

  const start = goal.periodStart.getTime()
  const end = goal.periodEnd.getTime()
  const now = Date.now()

  const daysTotal = Math.max(1, Math.round((end - start) / 86_400_000))
  const daysElapsed = Math.min(daysTotal, Math.max(0, Math.round((now - start) / 86_400_000)))
  const daysRemaining = Math.max(0, daysTotal - daysElapsed)

  const percentComplete = goal.targetAmount > 0 ? Math.min(100, (totalUsd / goal.targetAmount) * 100) : 0
  const paceUsdPerDay = daysElapsed > 0 ? totalUsd / daysElapsed : 0
  const requiredUsdPerDay = daysRemaining > 0 ? Math.max(0, goal.targetAmount - totalUsd) / daysRemaining : 0
  const expectedAtThisPoint = daysTotal > 0 ? goal.targetAmount * (daysElapsed / daysTotal) : 0
  const onTrack = totalUsd >= expectedAtThisPoint
  const forecastUsd = daysRemaining > 0 ? totalUsd + paceUsdPerDay * daysRemaining : totalUsd

  return {
    revenueUsd: totalUsd,
    percentComplete,
    daysElapsed,
    daysTotal,
    daysRemaining,
    paceUsdPerDay,
    requiredUsdPerDay,
    onTrack,
    forecastUsd,
    monthlyRevenue,
  }
}

export async function createGoal(input: {
  title: string
  description?: string
  targetAmount: number
  currency?: string
  periodStart?: Date
  periodEnd: Date
}): Promise<CofounderGoal> {
  // Only one active goal at a time — archive the previous one.
  await prisma.cofounderGoal.updateMany({
    where: { status: "active" },
    data: { status: "archived" },
  })

  return prisma.cofounderGoal.create({
    data: {
      title: input.title,
      description: input.description,
      targetAmount: input.targetAmount,
      currency: input.currency ?? "USD",
      periodStart: input.periodStart ?? new Date(),
      periodEnd: input.periodEnd,
      status: "active",
    },
  })
}

export async function archiveGoal(id: string): Promise<void> {
  await prisma.cofounderGoal.update({ where: { id }, data: { status: "archived" } })
}

export async function recentTasks(limit = 10): Promise<CofounderTask[]> {
  return prisma.cofounderTask.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  })
}
