import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"
import { getGateway, verifyGatewayPayment } from "@/lib/gateways"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"
import { enqueueJob } from "@/lib/queue"
import { APP_URL, GatewayId } from "@/lib/payments/types"

export const dynamic = "force-dynamic"

/**
 * Redirect target for hosted gateways (ExpressPay, Moolre). Resolves which
 * order/subscription the reference maps to, verifies server-side with the
 * provider, then redirects the customer to an appropriate status page.
 */
export async function GET(request: NextRequest) {
  try {
    const gateway = (request.nextUrl.searchParams.get("gateway") || "expresspay") as GatewayId
    const reference = request.nextUrl.searchParams.get("reference") || request.nextUrl.searchParams.get("order-id")
    const token = request.nextUrl.searchParams.get("token") || request.nextUrl.searchParams.get("externalref")

    const cfg = getGateway(gateway)
    if (!cfg) {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=error`)
    }

    const lookup = reference || token
    if (!lookup) {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=missing`)
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ reference: lookup }, { referenceId: lookup }, { gatewayRef: lookup }] },
    })
    const subscription = await prisma.subscription.findFirst({
      where: { OR: [{ reference: lookup }, { gatewayRef: lookup }] },
    })

    // Already finalised — redirect straight to success.
    if (order && order.status === "completed") {
      return NextResponse.redirect(`${APP_URL}/order-success?reference=${order.reference}`)
    }
    if (subscription && subscription.status === "active") {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=success`)
    }

    const verifyToken = token || (order?.gatewayRef as string) || (subscription?.gatewayRef as string) || ""
    const expectedAmount = order?.amount ?? subscription?.amount ?? undefined

    const result = await verifyGatewayPayment(gateway, verifyToken, { expectedAmount })

    if (order) {
      if (result.status === "success") {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "completed", transactionId: result.transactionId || order.transactionId },
        })
        await logAgentAction({
          agent: "PaymentBot",
          action: `${gateway}_payment_verified`,
          entityType: "order",
          entityId: order.id,
          level: "success",
          details: { reference: order.reference, gateway },
        })
        try { await generateReportForOrder(order.id) } catch {
          await enqueueJob("generate_report", { orderId: order.id })
        }
        try { await sendReceiptForOrder(order.id) } catch {
          await enqueueJob("send_receipt", { orderId: order.id })
        }
        return NextResponse.redirect(`${APP_URL}/order-success?reference=${order.reference}`)
      }
      if (result.status === "failed") {
        await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } })
        await logAgentAction({
          agent: "PaymentBot", action: `${gateway}_payment_failed`,
          entityType: "order", entityId: order.id, level: "warning",
          details: { reference: order.reference, gateway },
        })
        return NextResponse.redirect(`${APP_URL}/pricing?payment=failed&reference=${order.reference}`)
      }
      if (result.status === "mismatch") {
        await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } })
        return NextResponse.redirect(`${APP_URL}/pricing?payment=amount_mismatch`)
      }
      // pending — GoMoMo async or not yet confirmed
      return NextResponse.redirect(`${APP_URL}/pricing?payment=pending&reference=${order.reference}`)
    }

    if (subscription) {
      if (result.status === "success") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "active", transactionId: result.transactionId || subscription.transactionId },
        })
        await logAgentAction({
          agent: "PaymentBot", action: "subscription_activated",
          entityType: "subscription", entityId: subscription.id, level: "success",
          details: { reference: subscription.reference, gateway },
        })
        return NextResponse.redirect(`${APP_URL}/pricing?payment=success`)
      }
      if (result.status === "failed") {
        await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "failed" } })
        return NextResponse.redirect(`${APP_URL}/pricing?payment=failed`)
      }
      if (result.status === "mismatch") {
        await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "failed" } })
        return NextResponse.redirect(`${APP_URL}/pricing?payment=amount_mismatch`)
      }
      return NextResponse.redirect(`${APP_URL}/pricing?payment=pending`)
    }

    return NextResponse.redirect(`${APP_URL}/pricing?payment=not_found`)
  } catch (error) {
    console.error("Payment verify error:", error)
    return NextResponse.redirect(`${APP_URL}/pricing?payment=error`)
  }
}
