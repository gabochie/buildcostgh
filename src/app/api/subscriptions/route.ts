import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const subscriptions = await prisma.subscription.findMany({
    include: { plan: true, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(subscriptions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { email, planId } = body

  if (!email || !planId) {
    return NextResponse.json({ error: "Email and planId required" }, { status: 400 })
  }

  const plan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!plan || !plan.active) {
    return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
  }

  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + (plan.priceAnnual > 0 ? 12 : 1))

  const subscription = await prisma.subscription.create({
    data: {
      email,
      userId: session.user.id,
      planId,
      status: "active",
      currentPeriodEnd: periodEnd,
    },
    include: { plan: true },
  })

  return NextResponse.json(subscription, { status: 201 })
}