import { NextRequest, NextResponse } from "next/server"
import { getPaymentStatus } from "@/lib/momo"
import { prisma } from "@/lib/prisma"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"
import { logAgentAction } from "@/lib/agent-log"
import { enqueueJob } from "@/lib/queue"
import { apiRateLimit } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  const rate = await apiRateLimit(request, { maxRequests: 200, path: "momo-status" })
  if (!rate.ok && rate.response) return rate.response

  try {
    const reference = request.nextUrl.searchParams.get("reference")
    if (!reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { reference } })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status === "completed") {
      return NextResponse.json({ status: "success", reference })
    }

    if (!order.referenceId) {
      return NextResponse.json({ status: order.status })
    }

    const momoStatus = await getPaymentStatus(order.referenceId)

    if (momoStatus.status === "SUCCESSFUL") {
      // Atomic transition: only the first caller flips pending -> completed, so
      // concurrent verifies/callbacks can never double-generate the report/receipt.
      const transition = await prisma.order.updateMany({
        where: { id: order.id, status: "pending" },
        data: {
          status: "completed",
          transactionId: momoStatus.financialTransactionId || null,
        },
      })

      if (transition.count > 0) {
        await logAgentAction({
          agent: "PaymentBot",
          action: "momo_payment_verified",
          entityType: "order",
          entityId: order.id,
          level: "success",
          details: {
            reference: order.reference,
            amount: order.amount,
            package: order.package,
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
      }

      return NextResponse.json({ status: "success", reference })
    }

    if (momoStatus.status === "FAILED") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "failed" },
      })
      return NextResponse.json({ status: "failed", reference })
    }

    return NextResponse.json({ status: "pending", reference })
  } catch (error) {
    console.error("MoMo status error:", error)
    return NextResponse.json({ error: "Verification failed" }, { status: 500 })
  }
}
