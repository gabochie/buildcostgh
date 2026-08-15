import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { publishContentDraft } from "@/lib/social"
import { logAgentAction } from "@/lib/agent-log"

export const dynamic = "force-dynamic"
export const maxDuration = 60

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params
  const rawBody = await request.text().catch(() => null)
  let body: Record<string, unknown> | null = null
  if (rawBody) {
    try {
      body = JSON.parse(rawBody)
    } catch {
      body = null
    }
  }

  const existing = await prisma.contentDraft.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Draft not found" }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (typeof body?.status === "string") {
    const allowed = ["draft", "approved", "rejected"]
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    if (body.status === "approved") {
      data.status = "approved"
      data.approvedAt = new Date()
      data.reviewNote = typeof body.reviewNote === "string" ? body.reviewNote : null
    } else if (body.status === "rejected") {
      data.status = "rejected"
      data.reviewNote = typeof body.reviewNote === "string" ? body.reviewNote : null
    } else {
      data.status = "draft"
      data.reviewNote = typeof body.reviewNote === "string" ? body.reviewNote : existing.reviewNote
    }
  }

  if (typeof body?.title === "string") data.title = body.title
  if (typeof body?.caption === "string") data.caption = body.caption
  if (typeof body?.body === "string" || body?.body === null) data.body = body.body
  if (body?.offer && typeof body.offer === "object") data.offer = body.offer
  if (Array.isArray(body?.platforms)) {
    data.platforms = body.platforms.filter((p: unknown): p is string => typeof p === "string")
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  const draft = await prisma.contentDraft.update({ where: { id }, data })
  await logAgentAction({
    agent: "ContentBot",
    action: "draft_reviewed",
    entityType: "content_draft",
    entityId: id,
    level: draft.status === "approved" ? "success" : "info",
    details: { status: draft.status, reviewNote: data.reviewNote ?? null },
  })
  return NextResponse.json(draft)
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params

  try {
    const { published, posts } = await publishContentDraft(id)
    return NextResponse.json({ published, posts })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    )
  }
}
