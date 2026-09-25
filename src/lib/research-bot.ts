import "server-only"
import { prisma } from "./prisma"
import { logAgentAction } from "./agent-log"
import {
  buildBriefForSlot,
  proposeRateUpdates,
  summarizeBrief,
  type FieldObservation,
  type RateProposal,
  type RateRow,
  type ResearchBrief,
} from "./research-brief"
import { computeWindowSlots, loadContentPlan, pendingSlotsOf } from "./content-plan"
import { getPlanState } from "./content-planner"

export const RESEARCH_AGENT = "ResearchBot"
export const RESEARCH_MAX_BRIEFS_PER_RUN = Number(process.env.RESEARCH_MAX_BRIEFS_PER_RUN ?? 5) || 1
export const RESEARCH_HORIZON_DAYS = Number(process.env.RESEARCH_HORIZON_DAYS ?? 10) || 1

export type ResearchCycleResult = {
  briefs: ResearchBrief[]
  proposals: RateProposal[]
  pending: number
  autoPublishable: number
  error?: string
}

/**
 * Weekly ResearchBot cycle (runs ahead of the content cron):
 * 1. Resolves upcoming content-plan slots still needing drafts.
 * 2. Builds an evidence brief per slot from RegionRate rows + observations.
 * 3. Diffs observations against stored rates → founder-approved proposals.
 *
 * READ-ONLY against business tables: briefs and proposals are returned +
 * logged to AgentLog. Nothing writes rates, drafts, or posts. Publishing
 * tiers are enforced downstream: only briefs where every point is
 * `verified` are eligible for auto-publish.
 */
export async function runResearchCycle(
  observations: FieldObservation[] = [],
  opts: { maxBriefs?: number; horizonDays?: number } = {}
): Promise<ResearchCycleResult> {
  const plan = loadContentPlan()
  if (!plan) {
    return { briefs: [], proposals: [], pending: 0, autoPublishable: 0, error: "content/content-plan.json not found or invalid" }
  }

  const maxBriefs = opts.maxBriefs ?? RESEARCH_MAX_BRIEFS_PER_RUN
  const horizonDays = opts.horizonDays ?? RESEARCH_HORIZON_DAYS

  let rates: RateRow[]
  try {
    rates = await prisma.regionRate.findMany({ where: { published: true } })
  } catch (err) {
    return { briefs: [], proposals: [], pending: 0, autoPublishable: 0, error: err instanceof Error ? err.message : String(err) }
  }

  let slots: ReturnType<typeof computeWindowSlots>
  try {
    const state = await getPlanState()
    slots = computeWindowSlots(plan, new Date(), horizonDays, state.existingDateKeys, state.counts)
  } catch (err) {
    return { briefs: [], proposals: [], pending: 0, autoPublishable: 0, error: err instanceof Error ? err.message : String(err) }
  }

  const pending = pendingSlotsOf(slots)
  const now = new Date()
  const briefs = pending
    .slice(0, Math.max(1, maxBriefs))
    .map((s) => buildBriefForSlot({ dateKey: s.dateKey, pillarKey: s.pillarKey, topic: s.topic }, rates, observations, now))
  const proposals = proposeRateUpdates(rates, observations, now)
  const autoPublishable = briefs.filter((b) => b.eligibleForAutoPublish).length

  await logAgentAction({
    agent: RESEARCH_AGENT,
    action: "research_cycle",
    entityType: "research_brief",
    level: "success",
    details: {
      briefs: briefs.map(summarizeBrief),
      autoPublishable,
      proposals: proposals.length,
      pending: pending.length,
      observations: observations.length,
    },
  })

  return { briefs, proposals, pending: pending.length, autoPublishable }
}

/**
 * Phase-1 field intake: a supplier call, market visit, or scraper output is
 * validated and logged as evidence. It is usable immediately by passing it
 * into runResearchCycle; durable storage (ResearchObservation table) is
 * the Phase-2 follow-up.
 */
export async function submitFieldObservations(observations: FieldObservation[]): Promise<{ accepted: number }> {
  const valid = observations.filter(
    (o) => !!o && typeof o.regionSlug === "string" && !!o.regionSlug && o.value > 0 && !!o.source
  )
  if (valid.length > 0) {
    await logAgentAction({
      agent: RESEARCH_AGENT,
      action: "field_observations",
      entityType: "price_observation",
      level: "info",
      details: { count: valid.length, observations: valid },
    })
  }
  return { accepted: valid.length }
}
