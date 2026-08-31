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
    // Provider query params. For Moolre, `externalref` (and `reference`) carry
    // our local reference; for ExpressPay, `order-id` carries it. The bare
    // `reference`/`token` fallback keeps us robust if a provider only returns
    // its internal id — we match against all of our own id fields.
    const externalRef = request.nextUrl.searchParams.get("externalref")
    const orderId = request.nextUrl.searchParams.get("order-id")
    const refParam = request.nextUrl.searchParams.get("reference")
    const token = request.nextUrl.searchParams.get("token")

    const candidates = [externalRef, orderId, refParam, token]
      .filter((v): v is string => Boolean(v))
      .filter((v, i, arr) => arr.indexOf(v) === i)

    const cfg = getGateway(gateway)
    if (!cfg) {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=error`)
    }

    if (candidates.length === 0) {
      return NextResponse.redirect(`${APP_URL}/pricing?payment=missing`)
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: candidates.flatMap((c) => [
          { reference: c },
          { referenceId: c },
          { gatewayRef: c },
        ]),
      },
    })
    const subscription = await prisma.subscription.findFirst({
      where: {
        OR: candidates.flatMap((c) => [{ reference: c }, { gatewayRef: c }]),
      },
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
