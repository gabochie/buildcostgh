import { NextRequest, NextResponse } from "next/server"
import { submitPayment, getCheckoutUrl } from "@/lib/expresspay"
import { validateSubscriptionAmount } from "@/lib/pricing"
import { generateReference } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, fullName, phone, planSlug, amount } = body

    if (!email || !fullName || !planSlug || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const serverAmount = await validateSubscriptionAmount(String(planSlug), Number(amount))
    if (serverAmount === null) {
      return NextResponse.json({ error: "Invalid plan or amount" }, { status: 400 })
    }

    const plan = await prisma.plan.findUnique({ where: { slug: String(planSlug) } })
    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Plan not found or inactive" }, { status: 404 })
    }

    const session = await auth()

    const reference = generateReference()

    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + (planSlug === "annual-unlimited" ? 12 : 1))

    const subscription = await prisma.subscription.create({
      data: {
        email,
        fullName,
        phone,
        planId: plan.id,
        status: "pending",
        reference,
        amount: serverAmount,
        currentPeriodEnd: periodEnd,
        userId: session?.user?.id ?? null,
      },
    })

    const response = await submitPayment({
      amount: serverAmount,
      orderId: reference,
      orderDesc: `${plan.name} — BuildCost GH`,
      redirectUrl: `${APP_URL}/api/subscriptions/verify`,
      postUrl: `${APP_URL}/api/subscriptions/post-url`,
      firstName: fullName,
      email,
      phoneNumber: phone,
    })

    if (response.status !== 1 || !response.token) {
      await logAgentAction({
        agent: "PaymentBot",
        action: "expresspay_submit_failed",
        entityType: "subscription",
        entityId: subscription.id,
        level: "error",
        details: { reference, status: response.status, message: response.message },
      })
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "failed" },
      })
      return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { expresspayToken: response.token },
    })

    return NextResponse.json({ checkoutUrl: getCheckoutUrl(response.token), reference })
  } catch (error) {
    console.error("ExpressPay checkout error:", error)
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
  }
}
