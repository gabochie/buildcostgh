import { NextRequest, NextResponse } from "next/server"
import { queryPayment } from "@/lib/expresspay"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"

export const dynamic = "force-dynamic"

// ExpressPay POSTs here after async payment processing (MoMo).
// Must always return HTTP 200 — ExpressPay retries on failure.
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    let orderId = ""
    let token = ""
    if (contentType.includes("application/json")) {
      const body = await request.json()
      orderId = body["order-id"] || body.orderId || ""
      token = body.token || ""
    } else {
      const body = await request.text()
      const params = new URLSearchParams(body)
      orderId = params.get("order-id") || params.get("orderId") || ""
      token = params.get("token") || ""
    }

    if (!orderId || !token) {
      return new NextResponse("OK", { status: 200 })
    }

    const subscription = await prisma.subscription.findUnique({ where: { reference: orderId } })
    if (!subscription || subscription.status === "active") {
      return new NextResponse("OK", { status: 200 })
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
        return new NextResponse("OK", { status: 200 })
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
    } else if (result.result === 2 || result.result === 3) {
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
    }

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("ExpressPay post-url error:", error)
    // Always 200 so ExpressPay stops retrying; verify route handles fallback.
    return new NextResponse("OK", { status: 200 })
  }
}
