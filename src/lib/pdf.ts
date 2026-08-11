import puppeteer from "puppeteer"
import { buildTieredReportHtml, type ContractorInsight } from "./report-content"
import type { CalculatorInput, EstimateResult } from "@/types"

export async function generatePdf(html: string, options?: { landscape?: boolean; format?: "A4" | "Letter" }): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "load" })
    await page.emulateMediaType("screen")

    const pdf = await page.pdf({
      format: options?.format ?? "A4",
      landscape: options?.landscape ?? false,
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

export function buildReportHtml(title: string, contentHtml: string, meta?: { date?: string; customerName?: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { margin: 20mm 15mm; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1e293b; line-height: 1.6; }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #059669; margin-bottom: 30px; }
    .header h1 { color: #059669; font-size: 24px; margin: 0 0 5px; }
    .header p { color: #64748b; font-size: 12px; margin: 0; }
    .footer { text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 30px; font-size: 10px; color: #94a3b8; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    th { background: #f1f5f9; font-weight: 600; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-emerald { background: #d1fae5; color: #065f46; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    ${meta ? `.meta { text-align: right; font-size: 11px; color: #94a3b8; margin-bottom: 20px; }` : ""}
  </style>
</head>
<body>
  <div class="header">
    <h1>BuildCost GH</h1>
    <p>Construction Cost Intelligence Report</p>
  </div>
  ${meta ? `<div class="meta">${meta.date ? `Date: ${meta.date}<br>` : ""}${meta.customerName ? `Prepared for: ${meta.customerName}` : ""}</div>` : ""}
  ${contentHtml}
  <div class="footer">
    <p>BuildCost GH &mdash; buildcostgh.com &mdash; Confidential</p>
  </div>
</body>
</html>`
}

export async function generateOrderReport(order: {
  fullName: string
  reference: string
  package: string
  amount: number
  createdAt: Date
  input?: CalculatorInput | null
  estimate?: EstimateResult | null
  contractors?: ContractorInsight[]
}): Promise<Buffer> {
  const html = buildReportHtml(
    `Order Report — ${order.reference}`,
    buildTieredReportHtml({
      fullName: order.fullName,
      reference: order.reference,
      packageName: order.package,
      amount: order.amount,
      createdAt: order.createdAt,
      input: order.input ?? null,
      estimate: order.estimate ?? null,
      contractors: order.contractors ?? [],
    }),
    { date: order.createdAt.toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" }), customerName: order.fullName }
  )
  return generatePdf(html)
}
