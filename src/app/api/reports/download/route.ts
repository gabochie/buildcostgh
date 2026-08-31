import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { canAccessReport, REPORT_DIR } from "@/lib/report-access"
import { logAgentAction } from "@/lib/agent-log"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref")
  const token = request.nextUrl.searchParams.get("token")
  const kind = request.nextUrl.searchParams.get("kind") === "xlsx" ? "xlsx" : "pdf"

  if (!ref) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 })
  }

  const gate = await canAccessReport(ref, token)
  if (!gate.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: gate.status })
  }

  const order = await prisma.order.findUnique({ where: { reference: ref } })
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.status !== "completed") {
    return NextResponse.json({ error: "Order not completed" }, { status: 403 })
  }

  const fileName = `order-${order.reference.toLowerCase()}.${kind}`
  const filePath = `${process.cwd()}/${REPORT_DIR}/${fileName}`

  try {
    const fs = (await import("node:fs/promises")).default
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }
    const data = await fs.readFile(filePath)

    await logAgentAction({
      agent: "PaymentBot",
      action: "report_downloaded",
      entityType: "order",
      entityId: order.id,
      level: "info",
      details: { reference: ref, kind },
    })

    const contentDisposition = kind === "xlsx" ? "attachment" : "inline"
    const mimeType = kind === "xlsx"
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "application/pdf"

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${contentDisposition}; filename="${fileName}"`,
        "Content-Length": String(stat.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (err) {
    await logAgentAction({
      agent: "ReportBot",
      action: "report_download_missing_file",
      entityType: "order",
      entityId: order.id,
      level: "warning",
      details: { reference: ref, kind, error: err instanceof Error ? err.message : String(err) },
    })
    return NextResponse.json({ error: "Report not found" }, { status: 404 })
  }
}
