import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { getUpcomingPlanView } from "@/lib/content-planner"

export const dynamic = "force-dynamic"

/**
 * Admin-only read view of the 1-year Content Plan: resolved upcoming slots
 * with draft status, plus plan meta. No generation happens here.
 */
export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const view = await getUpcomingPlanView()
  if (!view) {
    return NextResponse.json({ error: "content/content-plan.json not found or invalid" }, { status: 404 })
  }

  return NextResponse.json({
    meta: view.plan.meta,
    totalSlots: view.slots.length,
    draftedSlots: view.slots.filter((s) => s.hasDraft).length,
    pillars: Object.fromEntries(
      Object.entries(view.plan.pillars).map(([key, p]) => [key, { title: p.title, topics: p.topicPool.length }])
    ),
    slots: view.slots.map((s) => ({
      date: s.dateKey,
      weekday: s.weekday,
      kind: s.kind,
      platforms: s.platforms,
      pillar: s.pillarKey,
      pillarTitle: s.pillarTitle,
      topic: s.topic,
      keyword: s.keyword ?? null,
      offer: s.offer.headline,
      status: s.hasDraft ? "drafted" : "planned",
    })),
  })
}