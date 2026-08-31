import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"
import { getGateway, verifyGatewayPayment } from "@/lib/gateways"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"
import { enqueueJob } from "@/lib/queue"

export const dynamic = "force-dynamic"

interface Ctx {
  params: Promise<{ gateway: string }>
}

/**
 * Async MOBILE-MONEY notification endpoint shared by redirect gateways
 * (ExpressPay, Moolre). Called by the provider some time after checkout when a
 * wallet payment settles. Like every notification, we re-verify with the
 * provider instead of trusting the posted payload.
 */
export async function POST(_request: NextRequest, ctx: Ctx) {
  try {
    const { gateway } = await ctx.params
    const cfg = getGateway(gateway)
    if (!cfg || !cfg.isConfigured()) {
      return NextResponse.json({ ok: false, error: "Unsupported gateway" }, { status: 400 })
    }

    // For ExpressPay the post-url is invoked with the token; read it from the
    // body if present (form-encoded or JSON).
    let body: Record<string, unknown> = {}
    try {
      const text = await _request.text()
      if (text) {
        if (_request.headers.get("content-type")?.includes("form")) {
          const params = new URLSearchParams(text)
          params.forEach((v, k) => { body[k] = v })
        } else {
          body = JSON.parse(text)
        }
      }
    } catch { /* ignore parse errors */ }

    const lookup = String(body["order-id"] || body.externalref || body.reference || body.token || "").trim()
    if (!lookup) {
      return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { OR: [{ reference: lookup }, { referenceId: lookup }, { gatewayRef: lookup }] },
    })
    const subscription = await prisma.subscription.findFirst({
      where: { OR: [{ reference: lookup }, { gatewayRef: lookup }] },
    })

    const token =
      String(body.token || body.externalref || "").trim() ||
      (order?.gatewayRef as string) ||
      (subscription?.gatewayRef as string) ||
      ""
    const expectedAmount = order?.amount ?? subscription?.amount ?? undefined

    const result = await verifyGatewayPayment(cfg.id, token, { expectedAmount })
    if (result.status !== "success") {
      // Keep pending/failed state accurate but always return 200 per gateway docs.
      if (result.status === "failed") {
        if (order) await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } })
        else if (subscription) await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "failed" } })
      }
      return NextResponse.json({ ok: true, status: result.status })
    }

    if (order) {
      // Atomic transition guards against concurrent post-url webhooks (and the
      // verify redirect) double-generating the report/receipt.
      const transition = await prisma.order.updateMany({
        where: { id: order.id, status: "pending" },
        data: { status: "completed", transactionId: result.transactionId || order.transactionId },
      })
      if (transition.count > 0) {
        await logAgentAction({
          agent: "PaymentBot", action: `${gateway}_union_payment_received`,
          entityType: "order", entityId: order.id, level: "success",
          details: { reference: order.reference, gateway },
        })
        try { await generateReportForOrder(order.id) } catch {
          await enqueueJob("generate_report", { orderId: order.id })
        }
        try { await sendReceiptForOrder(order.id) } catch {
          await enqueueJob("send_receipt", { orderId: order.id })
        }
      }
    } else if (subscription) {
      const transition = await prisma.subscription.updateMany({
        where: { id: subscription.id, status: "pending" },
        data: { status: "active", transactionId: result.transactionId || subscription.transactionId },
      })
      if (transition.count > 0) {
        await logAgentAction({
          agent: "PaymentBot", action: "subscription_activated",
          entityType: "subscription", entityId: subscription.id, level: "success",
          details: { reference: subscription.reference, gateway },
        })
      }
    }

    return NextResponse.json({ ok: true, status: "success" })
  } catch (error) {
    console.error("Payment post-url error:", error)
    return NextResponse.json({ ok: true, status: "unknown" })
  }
}
