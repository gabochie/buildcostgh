import * as XLSX from "xlsx"
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

function money(n: number): number {
  return Math.round(n)
}

// SheetJS community edition cannot write cell styles (fills/fonts), so
// sheets use structure instead: a title row, a blank row, then a header row.
// Number formats (!cols widths, merges, numFmt) are fully supported.
function finalizeSheet(ws: XLSX.WorkSheet, colWidths: number[], merges?: XLSX.Range[]) {
  ws["!cols"] = colWidths.map((wch) => ({ wch }))
  if (merges) ws["!merges"] = merges
}

function applyNumFmt(ws: XLSX.WorkSheet, col: number, fromRow: number, toRow: number) {
  for (let r = fromRow; r <= toRow; r++) {
    const addr = XLSX.utils.encode_cell({ c: col, r })
    const cell = ws[addr]
    if (cell && typeof cell.v === "number") cell.z = "#,##0"
  }
}

export async function generateReportWorkbook(ctx: WorkbookContext): Promise<Buffer> {
  const wb = XLSX.utils.book_new()
  wb.Props = { Title: "BuildCost GH — Construction Cost Report", Author: "BuildCost GH", CreatedDate: new Date() }

  // ── Summary ──
  const summaryRows: (string | number)[][] = [
    ["BuildCost GH — Construction Cost Report"],
    [],
    ["Order Reference", ctx.reference],
    ["Customer", ctx.fullName],
    ["Package", ctx.packageName],
    ["Amount Paid", `GHS ${money(ctx.amount).toLocaleString("en-GH")}`],
    ["Report Date", ctx.createdAt.toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })],
  ]
  if (ctx.input) {
    summaryRows.push(
      ["Bedrooms", ctx.input.bedrooms],
      ["Location", ctx.input.location],
      ["Floor Area", `${ctx.input.floorArea} m²`],
      ["Floors", ctx.input.floors],
      ["Finishing Grade", ctx.input.grade],
    )
  }
  if (ctx.estimate) {
    summaryRows.push(
      ["Price per m²", `GHS ${money(ctx.estimate.summary.pricePerSqm).toLocaleString("en-GH")}`],
      ["Total Area", `${ctx.estimate.summary.totalSqm} m²`],
      ["Estimated Total Cost", `GHS ${money(ctx.estimate.breakdown.total).toLocaleString("en-GH")}`],
    )
  }
  summaryRows.push([], ["Notes", "Preliminary estimate. Verify with a contractor before purchase. Rates vary by region and season."])
  const summary = XLSX.utils.aoa_to_sheet(summaryRows)
  finalizeSheet(summary, [28, 60], [{ s: { c: 0, r: 0 }, e: { c: 1, r: 0 } }])
  XLSX.utils.book_append_sheet(wb, summary, "Summary")

  // ── Cost Breakdown ──
  const breakdownRows: (string | number)[][] = [["Category", "Share", "Amount (GHS)"]]
  if (ctx.estimate) {
    const e = ctx.estimate
    breakdownRows.push(
      ["Foundation", "18%", money(e.breakdown.baseCost * 0.18)],
      ["Structure", "34%", money(e.breakdown.baseCost * 0.34)],
      ["Finishing", "38%", money(e.breakdown.baseCost * 0.38)],
      ["Services & Add-ons", "10%", money(e.breakdown.baseCost * 0.1 + e.breakdown.addonsCost)],
      ["Estimated Total", "100%", money(e.breakdown.total)],
    )
  } else {
    breakdownRows.push(["Run the free calculator to see your breakdown", "", 0])
  }
  const breakdown = XLSX.utils.aoa_to_sheet(breakdownRows)
  finalizeSheet(breakdown, [30, 12, 18])
  applyNumFmt(breakdown, 2, 1, breakdownRows.length - 1)
  XLSX.utils.book_append_sheet(wb, breakdown, "Cost Breakdown")

  // ── Material Quantities ──
  const materialsRows: (string | number)[][] = [
    ["Material", "Quantity", "Unit", "Indicative Unit Price (GHS)", "Est. Cost (GHS)", "Use"],
  ]
  const area = ctx.estimate?.summary.totalSqm ?? (parseFloat(ctx.input?.floorArea ?? "0") || 0)
  if (area > 0) {
    const rows = materialQuantityRows(area, ctx.estimate?.regionRates)
    for (const r of rows) {
      materialsRows.push([r.material, r.qty, r.unit, r.unitPrice, money(r.qty * r.unitPrice), r.note])
    }
    const materialsTotal = rows.reduce((sum, r) => sum + r.qty * r.unitPrice, 0)
    materialsRows.push(["Total (materials only)", "", "", "", money(materialsTotal), "Excludes labour, plant & fees"])
  } else {
    materialsRows.push(["Run the free calculator to see material quantities", "", "", "", "", ""])
  }
  const materials = XLSX.utils.aoa_to_sheet(materialsRows)
  finalizeSheet(materials, [32, 14, 12, 28, 18, 42])
  applyNumFmt(materials, 1, 1, materialsRows.length - 1)
  applyNumFmt(materials, 3, 1, materialsRows.length - 1)
  applyNumFmt(materials, 4, 1, materialsRows.length - 1)
  XLSX.utils.book_append_sheet(wb, materials, "Material Quantities")

  // ── Construction Timeline ──
  const timelineData: (string | number)[][] = [["Stage", "Activity", "Share of Cost", "Cumulative"]]
  let cumulative = 0
  for (const r of timelineRows()) {
    cumulative += r.costSharePct
    timelineData.push([r.month, r.phase, `${r.costSharePct}%`, `${cumulative}%`])
  }
  const timeline = XLSX.utils.aoa_to_sheet(timelineData)
  finalizeSheet(timeline, [14, 46, 16, 14])
  XLSX.utils.book_append_sheet(wb, timeline, "Construction Timeline")

  const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return Buffer.from(out)
}
