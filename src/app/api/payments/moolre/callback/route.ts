import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"
import { verifyTransaction } from "@/lib/moolre"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"
import { enqueueJob } from "@/lib/queue"

export const dynamic = "force-dynamic"

/**
 * Moolre server-to-server callback. The posted payload is a notification only —
 * we always re-verify against Moolre's authoritative status endpoint before
 * finalising anything.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Moolre posts a reference (externalref) in the callback. We derive the
    // local reference and re-verify server-side.
    const rawRef =
      body?.externalref ||
      body?.reference ||
      body?.data?.externalref ||
      (typeof body?.reference === "string" ? body.reference : null)

    if (!rawRef) {
      return NextResponse.json({ ok: false, error: "Missing reference" }, { status: 400 })
    }

    // Re-verify with Moolre rather than trusting the callback body.
    const verification = await verifyTransaction(rawRef)
    const data = !Array.isArray(verification.data) ? verification.data : undefined
    const success = verification.status === 1 && data && Number(data.txstatus) === 1

    const order = await prisma.order.findFirst({
      where: { OR: [{ reference: rawRef }, { referenceId: rawRef }, { gatewayRef: rawRef }] },
    })
    const subscription = await prisma.subscription.findFirst({
      where: { OR: [{ reference: rawRef }, { gatewayRef: rawRef }] },
    })

    if (!order && !subscription) {
      return NextResponse.json({ ok: false, error: "No matching payment" }, { status: 404 })
    }

    if (!success) {
      if (order) {
        await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } })
      } else if (subscription) {
        await prisma.subscription.update({ where: { id: subscription.id }, data: { status: "failed" } })
      }
      return NextResponse.json({ ok: false, status: "failed" })
    }

    if (order) {
      if (order.status === "completed") return NextResponse.json({ ok: true })
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "completed", transactionId: data?.transactionid || order.transactionId || null },
      })
      await logAgentAction({
        agent: "PaymentBot", action: "moolre_payment_received",
        entityType: "order", entityId: order.id, level: "success",
        details: { reference: order.reference, transactionId: data?.transactionid },
      })
      try { await generateReportForOrder(order.id) } catch {
        await enqueueJob("generate_report", { orderId: order.id })
      }
      try { await sendReceiptForOrder(order.id) } catch {
        await enqueueJob("send_receipt", { orderId: order.id })
      }
    } else if (subscription) {
      if (subscription.status === "active") return NextResponse.json({ ok: true })
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: "active", transactionId: data?.transactionid || subscription.transactionId || null },
      })
      await logAgentAction({
        agent: "PaymentBot", action: "moolre_subscription_activated",
        entityType: "subscription", entityId: subscription.id, level: "success",
        details: { reference: subscription.reference, transactionId: data?.transactionid },
      })
    }

    return NextResponse.json({ ok: true, status: "success" })
  } catch (error) {
    console.error("Moolre callback error:", error)
    return NextResponse.json({ ok: false, error: "Verification failed" }, { status: 500 })
  }
}
