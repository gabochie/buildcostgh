import type { CalculatorInput, EstimateResult } from "@/types"

export interface ContractorInsight {
  name: string
  title: string | null
  phone: string
  rating: number
  yearsOfExperience: number
  website: string | null
}

export interface ReportContext {
  fullName: string
  reference: string
  packageName: string
  amount: number
  createdAt: Date
  input: CalculatorInput | null
  estimate: EstimateResult | null
  contractors: ContractorInsight[]
}

export interface MaterialRow {
  material: string
  unit: string
  qty: number
  unitPrice: number
  note: string
}

export interface TimelineRow {
  month: string
  phase: string
  costSharePct: number
}

const fmt = (n: number) => `GHS ${Math.round(n).toLocaleString("en-GH")}`

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function tierOf(pkg: string): 1 | 2 | 3 {
  if (pkg === "Premium") return 3
  if (pkg === "Detailed") return 2
  return 1
}

function section(title: string, body: string): string {
  return `<h2 style="color:#059669;margin-top:30px;">${title}</h2>${body}`
}

// National average fallback unit prices (GHS)
const FALLBACK_RATES = {
  cement: 100, sand: 150, chippings: 180, block: 14,
  rebar: 16, roofing: 130, ceiling: 90, tiles: 120, paint: 15,
}

export function materialQuantityRows(
  areaSqm: number,
  regionRates?: EstimateResult["regionRates"] | null,
): MaterialRow[] {
  const q = (n: number) => Math.max(1, Math.round(n))
  const r = (key: keyof typeof FALLBACK_RATES, dbField?: number) =>
    dbField && dbField > 0 ? dbField : FALLBACK_RATES[key]
  return [
    { material: "Cement (50kg bags)", unit: "bags", qty: q(areaSqm * 2.2), unitPrice: r("cement", regionRates?.cement), note: "Foundation, blockwork, plaster & screed" },
    { material: "Sharp sand", unit: "m³", qty: q(areaSqm * 0.12), unitPrice: r("sand", regionRates?.sand), note: "Concrete & mortar mix" },
    { material: "Chippings / gravel", unit: "m³", qty: q(areaSqm * 0.08), unitPrice: r("chippings", regionRates?.granite), note: "Concrete aggregate" },
    { material: "Sandcrete blocks (6-inch)", unit: "blocks", qty: q(areaSqm * 24), unitPrice: r("block", regionRates?.block), note: "External & internal walls" },
    { material: "Reinforcement steel", unit: "kg", qty: q(areaSqm * 4.5), unitPrice: r("rebar", regionRates ? Math.round(regionRates.rebar / 1000) : undefined), note: "Foundation, columns, beams & slab" },
    { material: "Roofing sheets (long-span)", unit: "m²", qty: q(areaSqm * 1.3), unitPrice: r("roofing", regionRates?.roofing), note: "Incl. ridge & fascia allowance" },
    { material: "Ceiling boards & frame", unit: "m²", qty: q(areaSqm * 1.0), unitPrice: FALLBACK_RATES.ceiling, note: "PVC / gypsum with framing" },
    { material: "Floor & wall tiles", unit: "m²", qty: q(areaSqm * 0.95), unitPrice: FALLBACK_RATES.tiles, note: "Standard ceramic range" },
    { material: "Emulsion paint", unit: "m²", qty: q(areaSqm * 4.5), unitPrice: r("paint", regionRates?.paint), note: "Walls & ceilings, 2 coats" },
  ]
}

export function timelineRows(): TimelineRow[] {
  return [
    { month: "Month 1", phase: "Site clearance, surveys & setting out", costSharePct: 5 },
    { month: "Month 2", phase: "Foundation excavation & blinding", costSharePct: 5 },
    { month: "Month 3", phase: "Foundation walls & backfilling", costSharePct: 8 },
    { month: "Month 4", phase: "Ground slab & damp-proofing", costSharePct: 6 },
    { month: "Month 5", phase: "Blockwork to lintel level", costSharePct: 10 },
    { month: "Month 6", phase: "Lintels, columns & ring beam", costSharePct: 10 },
    { month: "Month 7", phase: "Roof structure (timber / steel)", costSharePct: 8 },
    { month: "Month 8", phase: "Roof covering & guttering", costSharePct: 8 },
    { month: "Month 9", phase: "Electrical & plumbing first fix", costSharePct: 8 },
    { month: "Month 10", phase: "Plastering & ceiling installation", costSharePct: 10 },
    { month: "Month 11", phase: "Tiling, painting & finishing", costSharePct: 14 },
    { month: "Month 12", phase: "Fixtures, second fix & handover", costSharePct: 8 },
  ]
}

function orderSummarySection(ctx: ReportContext): string {
  return section(
    "Order Summary",
    `<table>
      <tr><th>Reference</th><td>${esc(ctx.reference)}</td></tr>
      <tr><th>Customer</th><td>${esc(ctx.fullName)}</td></tr>
      <tr><th>Package</th><td>${esc(ctx.packageName)}</td></tr>
      <tr><th>Amount Paid</th><td>${fmt(ctx.amount)}</td></tr>
      <tr><th>Date</th><td>${ctx.createdAt.toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</td></tr>
      <tr><th>Status</th><td><span class="badge badge-emerald">Paid</span></td></tr>
    </table>`
  )
}

function projectOverviewSection(ctx: ReportContext): string {
  const i = ctx.input
  if (!i) {
    return section(
      "Project Overview",
      `<p>No calculator inputs were captured for this order. Run the free calculator at buildcostgh.com/calculator to generate a personalised estimate, then upgrade to regenerate this report with your project data.</p>`
    )
  }
  const addons = [
    i.pool && i.pool !== "No Pool" ? `Pool: ${esc(i.pool)}` : "",
    i.garden && i.garden !== "No Garden" ? `Garden: ${esc(i.garden)}` : "",
    i.security && i.security !== "Basic Security" ? `Security: ${esc(i.security)}` : "",
    i.solar && i.solar !== "No Solar" ? `Solar: ${esc(i.solar)}` : "",
  ].filter(Boolean)
  return section(
    "Project Overview",
    `<table>
      <tr><th>Bedrooms</th><td>${esc(i.bedrooms)}</td></tr>
      <tr><th>Location</th><td>${esc(i.location)}</td></tr>
      <tr><th>Floor Area</th><td>${esc(i.floorArea)} m²</td></tr>
      <tr><th>Floors</th><td>${esc(i.floors)}</td></tr>
      <tr><th>Finishing Grade</th><td>${esc(i.grade)}</td></tr>
      <tr><th>Add-ons</th><td>${addons.length > 0 ? addons.join(", ") : "None"}</td></tr>
    </table>`
  )
}

function costSummarySection(ctx: ReportContext): string {
  const e = ctx.estimate
  if (!e) return ""
  return section(
    "Cost Summary",
    `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:12px 0;">
      <div style="font-size:12px;color:#64748b;">Estimated Total Cost</div>
      <div style="font-size:28px;font-weight:700;color:#059669;">${fmt(e.breakdown.total)}</div>
      <div style="font-size:12px;color:#64748b;">${fmt(e.summary.pricePerSqm)} per m² &middot; ${e.summary.totalSqm} m² total area</div>
    </div>`
  )
}

function itemisedBreakdownSection(ctx: ReportContext): string {
  const e = ctx.estimate
  if (!e) return ""
  const rows = [
    { label: "Foundation", value: Math.round(e.breakdown.baseCost * 0.18), pct: "18%" },
    { label: "Structure", value: Math.round(e.breakdown.baseCost * 0.34), pct: "34%" },
    { label: "Finishing", value: Math.round(e.breakdown.baseCost * 0.38), pct: "38%" },
    { label: "Services & Add-ons", value: Math.round(e.breakdown.baseCost * 0.1) + e.breakdown.addonsCost, pct: "10%" },
  ]
  return section(
    "Itemised Cost Breakdown",
    `<table>
      <tr><th>Category</th><th>Share</th><th>Amount</th></tr>
      ${rows.map((r) => `<tr><td>${r.label}</td><td>${r.pct}</td><td>${fmt(r.value)}</td></tr>`).join("")}
      <tr><th>Estimated Total</th><th></th><th>${fmt(e.breakdown.total)}</th></tr>
    </table>`
  )
}

function regionalNotesSection(ctx: ReportContext): string {
  const i = ctx.input
  if (!i) return ""
  const mult = ctx.estimate?.breakdown.locationMultiplier ?? 1
  const band = mult >= 0.9 ? "premium-cost" : mult >= 0.75 ? "mid-cost" : "lower-cost"
  const notes: Record<string, string[]> = {
    "premium-cost": [
      `Building in ${esc(i.location)} carries some of the highest material and labour rates in Ghana, driven by demand and port proximity.`,
      "Cement and steel prices tend to track import costs closely; bulk-buying through a trusted supplier can save 5-10%.",
      "Skilled artisans are plentiful but command premium day rates — book well in advance during peak seasons (Aug-Dec).",
    ],
    "mid-cost": [
      `Building in ${esc(i.location)} offers balanced material and labour pricing.`,
      "Sand and chippings are usually available locally, which trims transport cost versus coastal cities.",
      "Verify land documentation early — regional land offices can have longer processing times.",
    ],
    "lower-cost": [
      `Building in ${esc(i.location)} benefits from notably lower labour and material delivery costs.`,
      "Some specialised trades (tilers, roofers) may need to travel from nearby cities — factor in their transport and lodging.",
      "Quality control is still essential: inspect blockwork and curing on site rather than assuming standards.",
    ],
  }
  return section(
    "Regional Cost Notes",
    `<p style="font-size:13px;color:#475569;">Based on current market data for ${esc(i.location)} (cost index ${mult.toFixed(2)} vs the Accra baseline of 1.00).</p>
    <ul style="font-size:13px;color:#475569;padding-left:20px;">
      ${notes[band].map((n) => `<li style="margin-bottom:6px;">${n}</li>`).join("")}
    </ul>`
  )
}

function diyVsContractorSection(): string {
  return section(
    "DIY vs Contractor Comparison",
    `<table>
      <tr><th>Factor</th><th>Self-Managed (DIY)</th><th>Professional Contractor</th></tr>
      <tr><td>Cost</td><td>Save 15-25% on labour, but absorb management time & errors</td><td>Higher upfront, but predictable with contract terms</td></tr>
      <tr><td>Time</td><td>Usually slower — coordination is on you</td><td>Faster with a dedicated crew and schedule</td></tr>
      <tr><td>Quality</td><td>Depends entirely on your supervision</td><td>Accountable to spec, with warranties possible</td></tr>
      <tr><td>Risk</td><td>You carry material & rework risk</td><td>Contract transfers most execution risk</td></tr>
      <tr><td>Best For</td><td>Simple projects where you can supervise daily</td><td>Larger builds, or when you live abroad</td></tr>
    </table>
    <p style="font-size:12px;color:#94a3b8;">Tip: many diaspora homeowners run a hybrid — a site manager for day-to-day control plus a contractor for trades.</p>`
  )
}

function materialQuantitiesSection(ctx: ReportContext): string {
  const area = ctx.estimate?.summary.totalSqm ?? (parseFloat(ctx.input?.floorArea ?? "0") || 0)
  if (area <= 0) return ""
  const rows = materialQuantityRows(area, ctx.estimate?.regionRates)
  const estCost = rows.reduce((sum, r) => sum + r.qty * r.unitPrice, 0)
  return section(
    "Complete Material Quantities",
    `<p style="font-size:12px;color:#94a3b8;">Indicative planning quantities for a ${area.toLocaleString("en-GH")} m² build. Verify exact take-offs with your contractor before purchasing.</p>
    <table>
      <tr><th>Material</th><th>Quantity</th><th>Unit</th><th>Indicative Unit Price</th><th>Est. Cost</th><th>Use</th></tr>
      ${rows
        .map(
          (r) =>
            `<tr><td>${r.material}</td><td>${r.qty.toLocaleString("en-GH")}</td><td>${r.unit}</td><td>${fmt(r.unitPrice)}</td><td>${fmt(r.qty * r.unitPrice)}</td><td>${r.note}</td></tr>`
        )
        .join("")}
      <tr><th>Total (materials only)</th><th colspan="4">${fmt(estCost)}</th><th></th></tr>
    </table>
    <p style="font-size:11px;color:#94a3b8;">Excludes labour, plant, professional fees and contingency. Market rates vary by region and season.</p>`
  )
}

function constructionTimelineSection(): string {
  const rows = timelineRows()
  let cumulative = 0
  return section(
    "12-Month Construction Timeline",
    `<table>
      <tr><th>Stage</th><th>Activity</th><th>Share of Cost</th><th>Cumulative</th></tr>
      ${rows
        .map((r) => {
          cumulative += r.costSharePct
          return `<tr><td>${r.month}</td><td>${r.phase}</td><td>${r.costSharePct}%</td><td>${cumulative}%</td></tr>`
        })
        .join("")}
    </table>
    <p style="font-size:12px;color:#94a3b8;">Typical sequence for a single-storey house. Expect 2-4 months of slippage in the wet season (April-June).</p>`
  )
}

function contractorInsightsSection(ctx: ReportContext): string {
  const i = ctx.input
  if (ctx.contractors.length === 0) {
    return section(
      "Regional Contractor Insights",
      `<p style="font-size:13px;color:#475569;">No vetted contractors are currently listed for ${i ? esc(i.location) : "your region"} on BuildCost GH. Here is how to vet one yourself:</p>
      <ul style="font-size:13px;color:#475569;padding-left:20px;">
        <li>Ask for 3 completed projects and visit at least one site in person.</li>
        <li>Request a written quotation broken down by work stage — refuse lump-sum-only quotes.</li>
        <li>Verify their business registration and ask for references you can call.</li>
        <li>Never pay more than 30% mobilisation; tie further payments to completed milestones.</li>
      </ul>`
    )
  }
  return section(
    "Regional Contractor Insights",
    `<p style="font-size:13px;color:#475569;">Vetted contractors active in your region:</p>
    <table>
      <tr><th>Company</th><th>Title</th><th>Experience</th><th>Rating</th><th>Contact</th></tr>
      ${ctx.contractors
        .map(
          (c) =>
            `<tr>
              <td><strong>${esc(c.name)}</strong>${c.website ? `<br><a href="${esc(c.website)}" style="font-size:11px;color:#059669;">${esc(c.website)}</a>` : ""}</td>
              <td>${c.title ? esc(c.title) : "—"}</td>
              <td>${c.yearsOfExperience} yrs</td>
              <td>${c.rating > 0 ? `${c.rating.toFixed(1)} ★` : "New"}</td>
              <td>${esc(c.phone)}</td>
            </tr>`
        )
        .join("")}
    </table>
    <p style="font-size:12px;color:#94a3b8;">Always request a written contract and milestone-based payment schedule before engaging any contractor.</p>`
  )
}

function expertTipsSection(): string {
  return section(
    "Expert Project Tips",
    `<ol style="font-size:13px;color:#475569;padding-left:20px;">
      <li style="margin-bottom:6px;"><strong>Price-lock your cement.</strong> Cement prices move monthly — negotiate bulk pricing with a distributor before the pour season.</li>
      <li style="margin-bottom:6px;"><strong>Buy steel early.</strong> Reinforcement steel tracks exchange rates; purchase and store it once your foundation design is fixed.</li>
      <li style="margin-bottom:6px;"><strong>Keep a 10% contingency.</strong> Site conditions and design tweaks routinely add 5-15% — budget for it before you start.</li>
      <li style="margin-bottom:6px;"><strong>Schedule around the rains.</strong> Plan concrete and roofing works between November and March where possible.</li>
      <li style="margin-bottom:6px;"><strong>Photograph every stage.</strong> A dated photo log protects you in disputes and helps the next contractor understand the build.</li>
      <li style="margin-bottom:6px;"><strong>Insulate the roof space.</strong> A modest spend on ceiling insulation cuts cooling costs for the life of the home.</li>
      <li style="margin-bottom:6px;"><strong>Get sign-off before covering works.</strong> Inspect the slab, blockwork and wiring before they are plastered over.</li>
      <li style="margin-bottom:6px;"><strong>Use milestone payments.</strong> Tie each payment to a completed, inspected stage — never pay the full balance upfront.</li>
    </ol>`
  )
}

function monitoringChecklistSection(): string {
  return section(
    "Project Monitoring Checklist",
    `<table>
      <tr><th>Stage</th><th>What to Check</th></tr>
      <tr><td>Before concrete pour</td><td>Rebar spacing, cover blocks, shuttering rigidity, mix ratio (1:2:4), water quality</td></tr>
      <tr><td>Blockwork</td><td>Plumb lines, mortar consistency, curing (wet walls 3-7 days), correct wall openings</td></tr>
      <tr><td>Roofing</td><td>Frame fixings, sheet overlap, ridge alignment, gutter fall to downpipes</td></tr>
      <tr><td>First fix</td><td>Cable sizes, conduit paths, pipe pressure test before plastering</td></tr>
      <tr><td>Finishing</td><td>Tile lippage, paint coverage, door/window operation, sealant at wet areas</td></tr>
      <tr><td>Handover</td><td>Full snag list, keys & manuals, warranty documents, as-built drawings</td></tr>
    </table>
    <p style="font-size:12px;color:#94a3b8;">Use this checklist at every site visit — take dated photos of each item and keep a simple spreadsheet log.</p>`
  )
}

function consultationOfferSection(): string {
  return section(
    "Your Premium Consultation",
    `<p style="font-size:13px;color:#475569;">Your Premium package includes a <strong>30-minute consultation call</strong> with a BuildCost GH cost advisor. Reply to your receipt email with your preferred times, or email hello@buildcostgh.com to book. Have your project inputs and this report at hand.</p>`
  )
}

function accessSection(): string {
  return `<p style="font-size:12px;color:#94a3b8;">Visit <a href="https://buildcostgh.com/dashboard/orders">buildcostgh.com/dashboard/orders</a> to access your report online anytime.</p>`
}

export function buildTieredReportHtml(ctx: ReportContext): string {
  const tier = tierOf(ctx.packageName)
  const parts: string[] = []
  parts.push(orderSummarySection(ctx))
  parts.push(projectOverviewSection(ctx))

  if (ctx.estimate && ctx.input) {
    parts.push(costSummarySection(ctx))
    parts.push(itemisedBreakdownSection(ctx))
    parts.push(regionalNotesSection(ctx))
    parts.push(diyVsContractorSection())
  }

  if (tier >= 2) {
    if (ctx.estimate || ctx.input) parts.push(materialQuantitiesSection(ctx))
    parts.push(constructionTimelineSection())
    parts.push(contractorInsightsSection(ctx))
  }

  if (tier >= 3) {
    parts.push(expertTipsSection())
    parts.push(monitoringChecklistSection())
    parts.push(consultationOfferSection())
  }

  parts.push(accessSection())
  return parts.join("\n")
}
