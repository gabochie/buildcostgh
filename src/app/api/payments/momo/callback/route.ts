import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getPaymentStatus } from "@/lib/momo"
import { logAgentAction } from "@/lib/agent-log"
import { enqueueJob } from "@/lib/queue"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"

export const dynamic = "force-dynamic"

/**
 * MTN MoMo callback.
 *
 * SECURITY: The MoMo callback body is treated ONLY as a trigger to look up the
 * order — never as authoritative payment confirmation. MTN's callback does not
 * carry a signature we can verify here, so an attacker could POST
 * `{ externalId: <order.referenceId>, status: "SUCCESSFUL" }` directly to this
 * endpoint and get a free report.
 *
 * Instead we poll MTN's own API (`getPaymentStatus`) using the order's stored
 * `referenceId`, which is authenticated to MTN with our merchant credentials.
 * Only a genuine MTN-confirmed status flips the order to "completed".
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { externalId } = body

    if (!externalId) {
      return NextResponse.json({ error: "Missing externalId" }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { referenceId: externalId },
    })

    if (!order) {
      await logAgentAction({
        agent: "PaymentBot",
        action: "momo_callback_order_not_found",
        entityType: "order",
        entityId: externalId,
        level: "error",
        details: { externalId },
      })
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status === "completed") {
      return NextResponse.json({ message: "Already processed" })
    }

    if (!order.referenceId) {
      await logAgentAction({
        agent: "PaymentBot",
        action: "momo_callback_no_reference_id",
        entityType: "order",
        entityId: order.id,
        level: "warning",
        details: { reference: order.reference },
      })
      return NextResponse.json({ message: "Ignored" })
    }

    // Authoritative check: confirm the real status against MTN, not the request body.
    const momoStatus = await getPaymentStatus(order.referenceId)

    if (momoStatus.status === "SUCCESSFUL") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "completed",
          transactionId: momoStatus.financialTransactionId || null,
        },
      })

      await logAgentAction({
        agent: "PaymentBot",
        action: "momo_payment_received",
        entityType: "order",
        entityId: order.id,
        level: "success",
        details: {
          reference: order.reference,
          amount: order.amount,
          package: order.package,
          financialTransactionId: momoStatus.financialTransactionId,
        },
      })

      try {
        await generateReportForOrder(order.id)
      } catch (reportError) {
        await logAgentAction({
          agent: "ReportBot",
          action: "report_generation_failed",
          entityType: "order",
          entityId: order.id,
          level: "error",
          details: {
            reference: order.reference,
            error: reportError instanceof Error ? reportError.message : String(reportError),
          },
        })
        await enqueueJob("generate_report", { orderId: order.id })
      }

      try {
        await sendReceiptForOrder(order.id)
      } catch {
        await enqueueJob("send_receipt", { orderId: order.id })
      }
    } else if (momoStatus.status === "FAILED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "failed" },
      })

      await logAgentAction({
        agent: "PaymentBot",
        action: "momo_payment_failed",
        entityType: "order",
        entityId: order.id,
        level: "warning",
        details: { reference: order.reference, status: momoStatus.status, externalId },
      })
    } else {
      // Still pending at MTN — the callback fired before settlement. Leave
      // the order pending; the client polls /api/payments/momo/status to finish.
      await logAgentAction({
        agent: "PaymentBot",
        action: "momo_callback_still_pending",
        entityType: "order",
        entityId: order.id,
        level: "info",
        details: { reference: order.reference, status: momoStatus.status },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    await logAgentAction({
      agent: "PaymentBot",
      action: "momo_callback_error",
      level: "error",
      details: { error: err instanceof Error ? err.message : String(err) },
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
