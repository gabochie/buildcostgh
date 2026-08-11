import ExcelJS from "exceljs"
import { materialQuantityRows, timelineRows } from "./report-content"
import type { CalculatorInput, EstimateResult } from "@/types"

export interface WorkbookContext {
  fullName: string
  reference: string
  packageName: string
  amount: number
  createdAt: Date
  input: CalculatorInput | null
  estimate: EstimateResult | null
}

function headerRow(ws: ExcelJS.Worksheet, values: string[]): void {
  const row = ws.addRow(values)
  row.font = { bold: true, color: { argb: "FFFFFFFF" } }
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } }
  row.height = 20
}

function money(n: number): number {
  return Math.round(n)
}

export async function generateReportWorkbook(ctx: WorkbookContext): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = "BuildCost GH"
  wb.created = new Date()

  const summary = wb.addWorksheet("Summary")
  summary.columns = [
    { header: "Field", key: "field", width: 28 },
    { header: "Value", key: "value", width: 40 },
  ]
  summary.getRow(1).font = { bold: true, size: 14, color: { argb: "FF059669" } }
  summary.getCell("A1").value = "BuildCost GH — Construction Cost Report"
  summary.mergeCells("A1:B1")
  summary.addRow([])
  const summaryRows: [string, string][] = [
    ["Order Reference", ctx.reference],
    ["Customer", ctx.fullName],
    ["Package", ctx.packageName],
    ["Amount Paid", `GHS ${money(ctx.amount).toLocaleString("en-GH")}`],
    ["Report Date", ctx.createdAt.toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })],
  ]
  if (ctx.input) {
    summaryRows.push(["Bedrooms", ctx.input.bedrooms])
    summaryRows.push(["Location", ctx.input.location])
    summaryRows.push(["Floor Area", `${ctx.input.floorArea} m²`])
    summaryRows.push(["Floors", ctx.input.floors])
    summaryRows.push(["Finishing Grade", ctx.input.grade])
  }
  if (ctx.estimate) {
    summaryRows.push(["Price per m²", `GHS ${money(ctx.estimate.summary.pricePerSqm).toLocaleString("en-GH")}`])
    summaryRows.push(["Total Area", `${ctx.estimate.summary.totalSqm} m²`])
    summaryRows.push(["Estimated Total Cost", `GHS ${money(ctx.estimate.breakdown.total).toLocaleString("en-GH")}`])
  }
  summaryRows.forEach(([f, v]) => summary.addRow({ field: f, value: v }))
  summary.addRow([])
  summary.addRow({ field: "Notes", value: "Preliminary estimate. Verify with a contractor before purchase. Rates vary by region and season." })

  const breakdown = wb.addWorksheet("Cost Breakdown")
  breakdown.columns = [
    { header: "Category", key: "category", width: 30 },
    { header: "Share", key: "share", width: 12 },
    { header: "Amount (GHS)", key: "amount", width: 18 },
  ]
  headerRow(breakdown, ["Category", "Share", "Amount (GHS)"])
  if (ctx.estimate) {
    const e = ctx.estimate
    const rows = [
      { category: "Foundation", share: "18%", amount: money(e.breakdown.baseCost * 0.18) },
      { category: "Structure", share: "34%", amount: money(e.breakdown.baseCost * 0.34) },
      { category: "Finishing", share: "38%", amount: money(e.breakdown.baseCost * 0.38) },
      { category: "Services & Add-ons", share: "10%", amount: money(e.breakdown.baseCost * 0.1 + e.breakdown.addonsCost) },
    ]
    rows.forEach((r) => {
      const row = breakdown.addRow(r)
      row.getCell("amount").numFmt = "#,##0"
    })
    const total = breakdown.addRow({ category: "Estimated Total", share: "100%", amount: money(e.breakdown.total) })
    total.font = { bold: true }
    total.getCell("amount").numFmt = "#,##0"
  } else {
    breakdown.addRow({ category: "Run the free calculator to see your breakdown", share: "", amount: 0 })
  }

  const materials = wb.addWorksheet("Material Quantities")
  materials.columns = [
    { header: "Material", key: "material", width: 32 },
    { header: "Quantity", key: "qty", width: 14 },
    { header: "Unit", key: "unit", width: 12 },
    { header: "Indicative Unit Price (GHS)", key: "unitPrice", width: 28 },
    { header: "Est. Cost (GHS)", key: "estCost", width: 18 },
    { header: "Use", key: "note", width: 42 },
  ]
  headerRow(materials, ["Material", "Quantity", "Unit", "Indicative Unit Price (GHS)", "Est. Cost (GHS)", "Use"])
  const area = ctx.estimate?.summary.totalSqm ?? (parseFloat(ctx.input?.floorArea ?? "0") || 0)
  if (area > 0) {
    const rows = materialQuantityRows(area)
    rows.forEach((r) => {
      const row = materials.addRow({
        material: r.material,
        qty: r.qty,
        unit: r.unit,
        unitPrice: r.unitPrice,
        estCost: money(r.qty * r.unitPrice),
        note: r.note,
      })
      row.getCell("qty").numFmt = "#,##0"
      row.getCell("unitPrice").numFmt = "#,##0"
      row.getCell("estCost").numFmt = "#,##0"
    })
    const materialsTotal = rows.reduce((sum, r) => sum + r.qty * r.unitPrice, 0)
    const totalRow = materials.addRow({ material: "Total (materials only)", qty: "", unit: "", unitPrice: "", estCost: money(materialsTotal), note: "Excludes labour, plant & fees" })
    totalRow.font = { bold: true }
    totalRow.getCell("estCost").numFmt = "#,##0"
  } else {
    materials.addRow({ material: "Run the free calculator to see material quantities", qty: "", unit: "", unitPrice: "", estCost: "", note: "" })
  }

  const timeline = wb.addWorksheet("Construction Timeline")
  timeline.columns = [
    { header: "Stage", key: "month", width: 14 },
    { header: "Activity", key: "phase", width: 46 },
    { header: "Share of Cost", key: "costSharePct", width: 16 },
    { header: "Cumulative", key: "cumulative", width: 14 },
  ]
  headerRow(timeline, ["Stage", "Activity", "Share of Cost", "Cumulative"])
  let cumulative = 0
  timelineRows().forEach((r) => {
    cumulative += r.costSharePct
    timeline.addRow({ month: r.month, phase: r.phase, costSharePct: `${r.costSharePct}%`, cumulative: `${cumulative}%` })
  })

  const buffer = await wb.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
