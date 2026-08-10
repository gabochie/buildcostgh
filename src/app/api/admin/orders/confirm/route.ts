import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"
import { logAgentAction } from "@/lib/agent-log"
import { enqueueJob } from "@/lib/queue"
import { generateReportForOrder, sendReceiptForOrder } from "@/lib/jobs"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!isAdmin(session?.user)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { orderId } = body
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id: String(orderId) } })
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status === "completed") {
      return NextResponse.json({ ok: true })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "completed" },
    })

    await logAgentAction({
      agent: "PaymentBot",
      action: "manual_payment_confirmed",
      entityType: "order",
      entityId: order.id,
      level: "success",
      details: { reference: order.reference, amount: order.amount, package: order.package },
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
        details: { reference: order.reference, error: reportError instanceof Error ? reportError.message : String(reportError) },
      })
      await enqueueJob("generate_report", { orderId: order.id })
    }

    try {
      await sendReceiptForOrder(order.id)
    } catch {
      await enqueueJob("send_receipt", { orderId: order.id })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Confirm order error:", error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}
