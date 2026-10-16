import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

export const dynamic = "force-dynamic"

const subscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(10).max(500),
    auth: z.string().min(10).max(500),
  }),
})

// POST /api/push/subscribe — store (or refresh) a push subscription.
// Works for guests (endpoint-keyed) and signed-in users.
export async function POST(req: NextRequest) {
  const parsed = subscribeSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "endpoint and keys.p256dh/auth are required" }, { status: 400 })
  }
  const session = await auth().catch(() => null)
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: {
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
      userId: session?.user?.id ?? undefined,
      email: session?.user?.email?.toLowerCase() ?? undefined,
    },
    create: {
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      userAgent,
      userId: session?.user?.id ?? null,
      email: session?.user?.email?.toLowerCase() ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}

// DELETE /api/push/subscribe — remove by endpoint.
export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json().catch(() => ({} as { endpoint?: string }))
  if (!endpoint) return NextResponse.json({ error: "endpoint is required" }, { status: 400 })
  await prisma.pushSubscription.deleteMany({ where: { endpoint } })
  return NextResponse.json({ ok: true })
}
