import { buildTieredReportHtml } from "./src/lib/report-content"
import { generateReportWorkbook } from "./src/lib/excel"

const input = { bedrooms: "4", location: "Accra", floorArea: "150", floors: "Single Floor", grade: "Standard", pool: "No Pool", garden: "Small Garden", security: "Enhanced Security", solar: "Solar Panels" }
const estimate = { breakdown: { baseCost: 500000, locationMultiplier: 1.0, gradeMultiplier: 1.0, addonsCost: 25000, total: 525000 }, summary: { pricePerSqm: 3500, totalSqm: 150, grade: "Standard", location: "Accra" } }
const contractors = [{ name: "Akwetey Builds", title: "Managing Director", phone: "+233 24 000 1111", rating: 4.8, yearsOfExperience: 12, website: "akweteybuilds.com" }]

const mk = (packageName: string) => ({ fullName: "Test Customer", reference: "BCG-TEST-001", packageName, amount: 341, createdAt: new Date("2026-08-11T00:00:00Z"), input, estimate, contractors })

async function main() {
  const basic = buildTieredReportHtml(mk("Basic"))
  const detailed = buildTieredReportHtml(mk("Detailed"))
  const premium = buildTieredReportHtml(mk("Premium"))

  const checks: [string, boolean][] = [
    ["Basic has Order Summary", basic.includes("Order Summary")],
    ["Basic has Itemised Cost Breakdown", basic.includes("Itemised Cost Breakdown")],
    ["Basic has Regional Cost Notes", basic.includes("Regional Cost Notes")],
    ["Basic has DIY comparison", basic.includes("DIY vs Contractor")],
    ["Basic LACKS Material Quantities", !basic.includes("Material Quantities")],
    ["Basic LACKS Timeline", !basic.includes("12-Month Construction Timeline")],
    ["Basic LACKS Contractor Insights", !basic.includes("Contractor Insights")],
    ["Basic LACKS Expert Tips", !basic.includes("Expert Project Tips")],
    ["Detailed has Material Quantities", detailed.includes("Material Quantities")],
    ["Detailed has Timeline", detailed.includes("12-Month Construction Timeline")],
    ["Detailed has Contractor Insights", detailed.includes("Contractor Insights")],
    ["Detailed has contractor name", detailed.includes("Akwetey Builds")],
    ["Detailed LACKS Expert Tips", !detailed.includes("Expert Project Tips")],
    ["Premium has Expert Tips", premium.includes("Expert Project Tips")],
    ["Premium has Monitoring Checklist", premium.includes("Monitoring Checklist")],
    ["Premium has Consultation", premium.includes("Your Premium Consultation")],
    ["Detailed longer than Basic", detailed.length > basic.length],
    ["Premium longer than Detailed", premium.length > detailed.length],
    ["HTML escaped", !buildTieredReportHtml({ ...mk("Basic"), fullName: "<script>alert(1)</script>" }).includes("<script>")],
  ]
  let pass = 0
  for (const [name, ok] of checks) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}`)
    if (ok) pass++
  }
  console.log(`\n${pass}/${checks.length} checks passed`)
  if (pass !== checks.length) process.exit(1)

  const wb = await generateReportWorkbook({ ...mk("Detailed"), fullName: "Test Customer" })
  console.log(`\nWorkbook buffer: ${wb.length} bytes, PK magic: ${wb[0] === 0x50 && wb[1] === 0x4b ? "yes" : "no"}`)
  if (!(wb[0] === 0x50 && wb[1] === 0x4b)) process.exit(1)

  const noEstimate = buildTieredReportHtml({ ...mk("Detailed"), input: null, estimate: null })
  console.log(`No-estimate fallback works: ${noEstimate.includes("No calculator inputs") && noEstimate.includes("12-Month Construction Timeline")}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
