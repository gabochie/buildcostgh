import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { sendPush } from "@/lib/push"
import { z } from "zod"

export const dynamic = "force-dynamic"

const sendSchema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(300),
  url: z.string().max(500).default("/"),
  email: z.string().email().optional(),
})

// POST /api/push/send — admin-only broadcast (or targeted by email).
export async function POST(req: NextRequest) {
  const session = await auth().catch(() => null)
  if (!session?.user || !isAdmin(session.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const parsed = sendSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 })
  }

  const subs = await prisma.pushSubscription.findMany({
    where: parsed.data.email ? { email: parsed.data.email.toLowerCase() } : undefined,
    take: 1000,
  })

  let sent = 0
  const gone: string[] = []
  for (const sub of subs) {
    const r = await sendPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      { title: parsed.data.title, body: parsed.data.body, url: parsed.data.url },
    )
    if (r.ok) sent++
    else if (r.gone) gone.push(sub.endpoint)
  }
  if (gone.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: gone } } })
  }

  return NextResponse.json({ ok: true, sent, total: subs.length, pruned: gone.length })
}
