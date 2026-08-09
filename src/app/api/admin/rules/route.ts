import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

const DEFAULT_RULES = {
  maxAutoPriceChangePct: "5",
  leadScoreHITLThreshold: "80",
  maxUnattendedOrderValue: "1000",
  autoRefundMax: "50",
  alertsErrorSpike: "true",
  alertsPaymentFailure: "true",
  alertsQueueBacklog: "true",
  alertsPricingDrift: "false",
  alertsHighValueLead: "true",
}

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const settings = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "rule_" } },
  })

  const rules = { ...DEFAULT_RULES }
  for (const s of settings) {
    const key = s.key.replace("rule_", "")
    rules[key as keyof typeof rules] = s.value
  }

  return NextResponse.json(rules)
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()

  for (const [key, value] of Object.entries(body)) {
    if (key in DEFAULT_RULES) {
      await prisma.siteSetting.upsert({
        where: { key: `rule_${key}` },
        update: { value: String(value) },
        create: { key: `rule_${key}`, value: String(value) },
      })
    }
  }

  return NextResponse.json({ saved: true })
}
