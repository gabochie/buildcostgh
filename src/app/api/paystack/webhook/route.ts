import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { logAgentAction } from "@/lib/agent-log"
import { enqueueJob } from "@/lib/queue"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"
import { verifyHmacSignature } from "@/lib/secure-compare"

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ""

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-paystack-signature")

    if (!verifyHmacSignature(PAYSTACK_SECRET, body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)

    if (event.event === "charge.success") {
      const reference = event.data.reference
      const amount = event.data.amount / 100
      const status = event.data.status

      const order = await prisma.order.findUnique({ where: { reference } })

      if (!order) {
        await logAgentAction({
          agent: "PaymentBot",
          action: "webhook_order_not_found",
          entityType: "order",
          entityId: reference,
          level: "error",
          details: { event: event.event, reference },
        })
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      if (order.status === "completed") {
        return NextResponse.json({ message: "Already processed" })
      }

      if (order.amount !== amount) {
        await logAgentAction({
          agent: "PaymentBot",
          action: "webhook_amount_mismatch",
          entityType: "order",
          entityId: order.id,
          level: "error",
          details: { reference, expected: order.amount, received: amount, status },
        })
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "completed" },
      })

      await logAgentAction({
        agent: "PaymentBot",
        action: "payment_received",
        entityType: "order",
        entityId: order.id,
        level: "success",
        details: { reference, amount, package: order.package },
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
          details: { reference, error: reportError instanceof Error ? reportError.message : String(reportError) },
        })
        await enqueueJob("generate_report", { orderId: order.id })
      }

      try {
        await sendReceiptForOrder(order.id)
      } catch {
        await enqueueJob("send_receipt", { orderId: order.id })
      }
    }

    if (event.event === "charge.failed") {
      const reference = event.data.reference
      await prisma.order.updateMany({
        where: { reference },
        data: { status: "failed" },
      })
      await logAgentAction({
        agent: "PaymentBot",
        action: "payment_failed",
        entityType: "order",
        entityId: reference,
        level: "warning",
        details: { event: event.event },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    await logAgentAction({
      agent: "PaymentBot",
      action: "webhook_error",
      level: "error",
      details: { error: err instanceof Error ? err.message : String(err) },
    })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
