import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { generateContentDraft } from "@/lib/content-engine"
import { runPlanBatch } from "@/lib/content-planner"
import type { SocialPlatform } from "@/lib/social"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const drafts = await prisma.contentDraft.findMany({
    orderBy: { createdAt: "desc" },
    include: { posts: { orderBy: { createdAt: "desc" } } },
  })
  return NextResponse.json(drafts)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)

  // Manual trigger of the Content Plan batch (keeps the 1-year plan filled).
  if (body?.plan === true) {
    const result = await runPlanBatch()
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({
      plan: true,
      generated: result.generated,
      pending: result.pending,
      drafts: result.slots.map((s) => ({ date: s.dateKey, kind: s.kind, pillar: s.pillarKey, topic: s.topic })),
    })
  }

  const platforms = (body?.platforms ?? []) as SocialPlatform[]

  const result = await generateContentDraft({ platforms })
  if (!result.draft) {
    return NextResponse.json({ error: result.error ?? "Generation failed" }, { status: 500 })
  }

  return NextResponse.json({ draft: result.draft })
}
