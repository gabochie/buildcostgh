import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Admins can enumerate all subscriptions (reconciliation); a regular customer
  // must only ever see their own subscriptions (matched by userId or email).
  const viewerId = session.user.id
  const viewerEmail = session.user.email?.toLowerCase()

  const where = isAdmin(session.user)
    ? {}
    : {
        OR: [
          ...(viewerId ? [{ userId: viewerId }] : []),
          ...(viewerEmail ? [{ email: { equals: viewerEmail, mode: "insensitive" as const } }] : []),
        ],
      }

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: { plan: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(subscriptions)
}
