import { NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/lib/paystack"
import { prisma } from "@/lib/prisma"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"
import { logAgentAction } from "@/lib/agent-log"
import { enqueueJob } from "@/lib/queue"

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get("reference")
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const response = await verifyPayment(reference)
    const data = response.data

    if (response.status && data?.status === "success") {
      const order = await prisma.order.findUnique({ where: { reference } })
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 })
      }

      if (data.amount != null && order.amount !== data.amount / 100) {
        await logAgentAction({
          agent: "PaymentBot",
          action: "verify_amount_mismatch",
          entityType: "order",
          entityId: order.id,
          level: "error",
          details: { reference, expected: order.amount, received: data.amount / 100 },
        })
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "completed" },
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
        // Never drop the receipt silently — retry via the durable job queue.
        await enqueueJob("send_receipt", { orderId: order.id })
      }

      return NextResponse.json({ status: "success", data })
    }

    await prisma.order.update({
      where: { reference },
      data: { status: "failed" },
    })

    return NextResponse.json({ status: "failed" })
  } catch (error) {
    console.error("Paystack verify error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
