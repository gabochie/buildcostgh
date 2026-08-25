import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"
import { enqueueJob } from "@/lib/queue"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { externalId, status, financialTransactionId } = body

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
        details: { externalId, status },
      })
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status === "completed") {
      return NextResponse.json({ message: "Already processed" })
    }

    if (status === "SUCCESSFUL" || status === "successful") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "completed",
          transactionId: financialTransactionId || null,
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
          financialTransactionId,
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
    } else {
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
        details: { reference: order.reference, status, externalId },
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
