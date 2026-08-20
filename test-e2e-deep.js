const BASE = "http://localhost:3111"

async function run() {
  console.log("=== EXTENDED CALCULATOR DATA (building type mode) ===\n")

  const res = await fetch(BASE + "/api/calculator", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ buildingCategory:"commercial", location:"Greater Accra", floorArea:500, floors:4, grade:"premium" })
  })
  const data = await res.json()

  console.log("breakdown.total:", data.breakdown?.total)
  console.log("breakdown.baseCost:", data.breakdown?.baseCost)
  console.log("summary:", JSON.stringify(data.summary, null, 2))

  if (data.extended) {
    const ext = data.extended
    console.log("\n--- extended ---")
    console.log("costRange:", JSON.stringify(ext.costRange))
    console.log("confidenceScore:", ext.confidenceScore)
    console.log("totalProfessionalFees:", ext.totalProfessionalFees)
    console.log("contingency:", ext.contingency)
    console.log("escalation:", ext.escalation)
    console.log("dataSource:", ext.dataSource)
    console.log("elementalBreakdown:", ext.elementalBreakdown?.length, "items")
    if (ext.elementalBreakdown?.length) {
      ext.elementalBreakdown.forEach(e => {
        console.log("  ", e.name, ":", e.amount, "(" + (e.percentage * 100).toFixed(1) + "%)")
      })
    }
    console.log("professionalFees:", ext.professionalFees?.length, "items")
    if (ext.professionalFees?.length) {
      ext.professionalFees.forEach(f => {
        console.log("  ", f.discipline, ":", f.amount, "(" + (f.percentage * 100).toFixed(1) + "%)")
      })
    }
    console.log("assumptions:", ext.assumptions?.length, "items")
    console.log("exclusions:", ext.exclusions?.length, "items")
  } else {
    console.log("\nNO extended data (legacy mode)")
  }

  // Test residential backward compat
  console.log("\n\n=== RESIDENTIAL BACKWARD COMPAT ===\n")
  const res2 = await fetch(BASE + "/api/calculator", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ bedrooms:"4", location:"Ashanti", floorArea:"150", floors:"Two Floors", grade:"standard" })
  })
  const data2 = await res2.json()
  console.log("breakdown.total:", data2.breakdown?.total)
  console.log("summary:", JSON.stringify(data2.summary, null, 2))
  console.log("has extended:", !!data2.extended)

  // Test all 16 regions
  console.log("\n\n=== REGIONAL COST VARIATION (3-bed residential, standard) ===\n")
  const regions = ["Greater Accra","Ashanti","Western","Central","Eastern","Volta","Northern","Upper East","Upper West","Bono","Bono East","Ahafo","Western North","Oti","Savannah","North East"]
  for (const loc of regions) {
    const r = await fetch(BASE + "/api/calculator", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ bedrooms:"3", location:loc, floorArea:"120", floors:"Single Floor", grade:"standard" })
    })
    const d = await r.json()
    console.log(loc.padEnd(20), "GHS", String(d.breakdown?.total ?? "?").padStart(10))
  }
}
run()
