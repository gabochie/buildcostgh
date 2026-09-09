import "server-only"
import { prisma } from "./prisma"
import { generateContentBatch, CONTENT_AGENT } from "./content-engine"
import {
  computeWindowSlots,
  describeSlot,
  loadContentPlan,
  pendingSlotsOf,
  type ContentPlan,
  type PlannedSlot,
  type TopicCounts,
} from "./content-plan"
import { logAgentAction } from "./agent-log"

export const CONTENT_PLAN_DRAFTS_PER_RUN = Number(process.env.CONTENT_PLAN_DRAFTS_PER_RUN ?? 5) || 1
export const CONTENT_PLAN_HORIZON_DAYS = Number(process.env.CONTENT_PLAN_HORIZON_DAYS ?? 10) || 1

const SOURCE_PREFIX = "content-plan:"

/**
 * Load the plan + derive generation state from existing ContentDraft rows.
 * Each plan-generated draft carries `source = content-plan:<dateKey>:<pillar>:<index>`,
 * so "already generated" and per-pillar topic rotation are fully derivable from
 * the database — no separate state file to keep in sync on serverless.
 */
export async function getPlanState(): Promise<{ existingDateKeys: Set<string>; counts: TopicCounts }> {
  const rows = await prisma.contentDraft.findMany({
    where: { source: { startsWith: SOURCE_PREFIX } },
    select: { source: true },
  })

  const existingDateKeys = new Set<string>()
  const counts: TopicCounts = {}

  for (const row of rows) {
    const parts = (row.source ?? "").split(":")
    if (parts.length < 4) continue
    const [, dateKey, pillar] = parts
    if (!dateKey || !pillar) continue
    existingDateKeys.add(`${SOURCE_PREFIX}${dateKey}:`)
    counts[pillar] = (counts[pillar] ?? 0) + 1
  }

  return { existingDateKeys, counts }
}

export type PlanBatchResult = {
  generated: number
  slots: PlannedSlot[]
  pending: number
  error?: string
}

/**
 * Generate drafts for the next upcoming plan slots that still need them.
 * Deterministic + adjustable: every slot resolves from content/content-plan.json,
 * deduped against existing drafts. Drafts land in the admin approval queue
 * (never auto-published). Stops after `draftsPerRun` to respect function limits;
 * the weekly cron keeps filling until the rolling window is complete.
 */
export async function runPlanBatch(plan: ContentPlan | null = null): Promise<PlanBatchResult> {
  const resolvedPlan = plan ?? loadContentPlan()
  if (!resolvedPlan) {
    return { generated: 0, slots: [], pending: 0, error: "content/content-plan.json not found or invalid" }
  }

  let state: { existingDateKeys: Set<string>; counts: TopicCounts }
  try {
    state = await getPlanState()
  } catch (err) {
    return { generated: 0, slots: [], pending: 0, error: err instanceof Error ? err.message : String(err) }
  }

  const windowSlots = computeWindowSlots(resolvedPlan, new Date(), CONTENT_PLAN_HORIZON_DAYS, state.existingDateKeys, state.counts)
  const pending = pendingSlotsOf(windowSlots)
  if (pending.length === 0) {
    return { generated: 0, slots: [], pending: 0 }
  }

  const target = pending.slice(0, CONTENT_PLAN_DRAFTS_PER_RUN)
  const result = await generateContentBatch(target)
  if (result.error && result.drafts.length === 0) {
    return { generated: 0, slots: [], pending: pending.length, error: result.error }
  }

  if (result.error) {
    await logAgentAction({
      agent: CONTENT_AGENT,
      action: "plan_draft_partial_failure",
      entityType: "content_draft",
      level: "warning",
      details: { generated: result.drafts.length, error: result.error, firstSlot: target[0] ? describeSlot(target[0]) : null },
    })
  }

  return { generated: result.drafts.length, slots: target.slice(0, result.drafts.length), pending: pending.length }
}

/**
 * Resolve the full upcoming window (without generating) for the admin panel.
 */
export async function getUpcomingPlanView(plan: ContentPlan | null = null): Promise<{
  plan: ContentPlan | null
  slots: PlannedSlot[]
  existingDateKeys: string[]
} | null> {
  const resolvedPlan = plan ?? loadContentPlan()
  if (!resolvedPlan) return null
  const { existingDateKeys } = await getPlanState()
  const slots = computeWindowSlots(resolvedPlan, new Date(), CONTENT_PLAN_HORIZON_DAYS, new Set(existingDateKeys), {})
  return { plan: resolvedPlan, slots, existingDateKeys: [...existingDateKeys] }
}

export { SOURCE_PREFIX }