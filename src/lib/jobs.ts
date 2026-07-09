import { prisma } from "./prisma"
import { registerJobHandler } from "./queue"
import { logAgentAction } from "./agent-log"
import { generateOrderReport } from "./pdf"
import { enqueueJob } from "./queue"

export function registerAllJobHandlers() {
  registerJobHandler("generate_report", async (payload: any) => {
    const { orderId } = payload
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) throw new Error(`Order ${orderId} not found`)

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
  })

  registerJobHandler("send_receipt", async (payload: any) => {
    const { orderId, email } = payload
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
        details: { email },
      })
      return
    }

    const domain = process.env.NEXT_PUBLIC_APP_URL || "https://buildcostgh.com"

    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resentKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BuildCost GH <reports@buildcostgh.com>",
          to: email,
          subject: `Your ${order.package} Report — BuildCost GH`,
          html: `
            <h2>Thank you for your purchase, ${order.fullName}!</h2>
            <p>Your <strong>${order.package}</strong> report is ready.</p>
            <p><strong>Order Reference:</strong> ${order.reference}</p>
            ${order.reportUrl ? `<p><a href="${domain}${order.reportUrl}" style="display:inline-block;padding:12px 24px;background:#059669;color:white;border-radius:8px;text-decoration:none;">Download Your Report</a></p>` : ""}
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
        details: { email },
      })
    } catch (err: any) {
      await logAgentAction({
        agent: "PaymentBot",
        action: "receipt_failed",
        entityType: "order",
        entityId: orderId,
        level: "error",
        details: { email, error: err?.message },
      })
      await enqueueJob("send_receipt", { orderId, email })
    }
  })

  registerJobHandler("nurture_lead", async (payload: any) => {
    const { email, name } = payload
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
    } catch (err: any) {
      await logAgentAction({
        agent: "LeadBot",
        action: "nurture_email_failed",
        entityType: "lead",
        entityId: email,
        level: "error",
        details: { error: err?.message },
      })
    }
  })
}
