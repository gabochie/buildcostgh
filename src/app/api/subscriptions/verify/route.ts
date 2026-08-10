import { NextRequest, NextResponse } from "next/server"
import { queryPayment } from "@/lib/expresspay"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"

export const dynamic = "force-dynamic"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get("order-id")
    const token = request.nextUrl.searchParams.get("token")

    if (!orderId || !token) {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=missing`)
    }

    const subscription = await prisma.subscription.findUnique({ where: { reference: orderId } })
    if (!subscription) {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=not_found`)
    }

    if (subscription.status === "active") {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=success`)
    }

    const result = await queryPayment(token)

    if (result.result === 1) {
      if (subscription.amount !== null && Number(result.amount) !== subscription.amount) {
        await logAgentAction({
          agent: "PaymentBot",
          action: "subscription_amount_mismatch",
          entityType: "subscription",
          entityId: subscription.id,
          level: "error",
          details: { reference: orderId, expected: subscription.amount, received: result.amount },
        })
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "failed" },
        })
        return NextResponse.redirect(`${APP_URL}/pricing?payment=amount_mismatch`)
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "active",
          transactionId: result["transaction-id"] || null,
          expresspayToken: token,
        },
      })

      await logAgentAction({
        agent: "PaymentBot",
        action: "subscription_activated",
        entityType: "subscription",
        entityId: subscription.id,
        level: "success",
        details: { reference: orderId, amount: result.amount, transactionId: result["transaction-id"] },
      })

      return NextResponse.redirect(`${APP_URL}/pricing?payment=success`)
    }

    if (result.result === 2 || result.result === 3) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "failed" },
      })
      await logAgentAction({
        agent: "PaymentBot",
        action: "subscription_declined",
        entityType: "subscription",
        entityId: subscription.id,
        level: "warning",
        details: { reference: orderId, result: result.result, resultText: result["result-text"] },
      })
      return NextResponse.redirect(`${APP_URL}/pricing?payment=failed`)
    }

    // result === 4 (pending) — async MoMo; post-url will complete it.
    // Do not mark failed; the post-url callback finalizes the status.
    return NextResponse.redirect(`${APP_URL}/pricing?payment=pending`)
  } catch (error) {
    console.error("ExpressPay verify error:", error)
    return NextResponse.redirect(`${APP_URL}/pricing?payment=error`)
  }
}
