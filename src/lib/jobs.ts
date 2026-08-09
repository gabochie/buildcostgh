import { prisma } from "./prisma"
import { registerJobHandler } from "./queue"
import { logAgentAction } from "./agent-log"
import { generateOrderReport } from "./pdf"

export async function generateReportForOrder(orderId: string): Promise<string> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error(`Order ${orderId} not found`)

  if (order.reportUrl) return order.reportUrl

  const pdfBuffer = await generateOrderReport({
    fullName: order.fullName,
    reference: order.reference,
    package: order.package,
    amount: order.amount,
    createdAt: order.createdAt,
  })

  const fs = await import("fs/promises")
  const path = await import("path")
  const reportDir = path.join(process.cwd(), "public", "reports")
  const fileName = `order-${order.reference.toLowerCase()}.pdf`
  const filePath = path.join(reportDir, fileName)

  await fs.mkdir(reportDir, { recursive: true })
  await fs.writeFile(filePath, pdfBuffer)

  const reportUrl = `/reports/${fileName}`
  await prisma.order.update({
    where: { id: orderId },
    data: { reportUrl },
  })

  await logAgentAction({
    agent: "ReportBot",
    action: "report_generated",
    entityType: "order",
    entityId: orderId,
    level: "success",
    details: { reportUrl, reference: order.reference },
  })

  return reportUrl
}

export async function sendReceiptForOrder(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error(`Order ${orderId} not found`)

  const resentKey = process.env.RESEND_API_KEY
  if (!resentKey) {
    await logAgentAction({
      agent: "PaymentBot",
      action: "receipt_skipped_no_api_key",
      entityType: "order",
      entityId: orderId,
      level: "warning",
      details: { email: order.email },
    })
    return
  }

  const domain = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
  const reportUrl = order.reportUrl ? `${domain}${order.reportUrl}` : null

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resentKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BuildCost GH <reports@buildcostgh.com>",
        to: order.email,
        subject: `Your ${order.package} Report — BuildCost GH`,
        html: `
          <h2>Thank you for your purchase, ${order.fullName}!</h2>
          <p>Your <strong>${order.package}</strong> report is ready.</p>
          <p><strong>Order Reference:</strong> ${order.reference}</p>
          ${reportUrl ? `<p><a href="${reportUrl}" style="display:inline-block;padding:12px 24px;background:#059669;color:white;border-radius:8px;text-decoration:none;">Download Your Report</a></p>` : ""}
          <p>You can also access your report anytime at <a href="${domain}/dashboard/orders">your dashboard</a>.</p>
          <hr>
          <p style="color:#6b7280;font-size:12px;">BuildCost GH — buildcostgh.com</p>
        `,
      }),
    })

    await logAgentAction({
      agent: "PaymentBot",
      action: "receipt_sent",
      entityType: "order",
      entityId: orderId,
      level: "success",
      details: { email: order.email },
    })
  } catch (err) {
    await logAgentAction({
      agent: "PaymentBot",
      action: "receipt_failed",
      entityType: "order",
      entityId: orderId,
      level: "error",
      details: { email: order.email, error: err instanceof Error ? err.message : String(err) },
    })
    throw err
  }
}

export function registerAllJobHandlers() {
  registerJobHandler("generate_report", async (payload) => {
    const { orderId } = payload as { orderId: string }
    await generateReportForOrder(orderId)
  })

  registerJobHandler("send_receipt", async (payload) => {
    const { orderId } = payload as { orderId: string }
    await sendReceiptForOrder(orderId)
  })

  registerJobHandler("nurture_lead", async (payload) => {
    const { email, name } = payload as { email: string; name?: string }
    const domain = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"
    const resentKey = process.env.RESEND_API_KEY

    if (!resentKey) return

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resentKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BuildCost GH <hello@buildcostgh.com>",
          to: email,
          subject: `Plan Your Dream Home in Ghana — Free Guide`,
          html: `
            <h2>Hi ${name || "there"}!</h2>
            <p>Thanks for checking out BuildCost GH. We help Ghanaians and the diaspora plan and budget for construction projects in Ghana.</p>
            <p><a href="${domain}/calculator" style="display:inline-block;padding:12px 24px;background:#059669;color:white;border-radius:8px;text-decoration:none;">Get Your Free Estimate</a></p>
            <p>Have questions? Reply to this email — we'd love to help.</p>
            <hr>
            <p style="color:#6b7280;font-size:12px;">BuildCost GH — buildcostgh.com</p>
          `,
        }),
      })

      await logAgentAction({
        agent: "LeadBot",
        action: "nurture_email_sent",
        entityType: "lead",
        entityId: email,
        level: "success",
      })
    } catch (err) {
      await logAgentAction({
        agent: "LeadBot",
        action: "nurture_email_failed",
        entityType: "lead",
        entityId: email,
        level: "error",
        details: { error: err instanceof Error ? err.message : String(err) },
      })
    }
  })
}
