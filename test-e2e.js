const BASE = "http://localhost:3111"

async function test(name, url, opts) {
  try {
    const res = await fetch(url, opts || {})
    const text = await res.text()
    let json
    try { json = JSON.parse(text) } catch { json = null }
    const ok = res.status >= 200 && res.status < 300
    console.log(ok ? "PASS" : "FAIL", "(" + res.status + ")", name)
    if (json) {
      const s = JSON.stringify(json)
      console.log("     " + s.slice(0, 400))
    }
    return json
  } catch (e) {
    console.log("FAIL (err)", name, e.message)
    return null
  }
}

async function run() {
  // ═══════ PUBLIC ═══════
  console.log("=== PUBLIC ENDPOINTS ===")

  const bt = await test("GET /api/building-types", BASE + "/api/building-types")
  console.log("     categories:", bt?.categories?.length ?? "N/A")

  const pc = await test("POST /api/permit-checklist", BASE + "/api/permit-checklist", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ buildingCategorySlug:"residential", location:"Greater Accra", floorArea:150, floors:2 })
  })
  console.log("     requirements:", pc?.requirements?.length ?? "N/A", "authority:", pc?.authority?.name ?? "N/A")

  await test("POST /api/calculator (residential)", BASE + "/api/calculator", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ bedrooms:"3", location:"Greater Accra", floorArea:"120", floors:"Single Floor", grade:"standard" })
  })

  const btResult = await test("POST /api/calculator (building type)", BASE + "/api/calculator", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ buildingCategory:"commercial", location:"Ashanti", floorArea:500, floors:3, grade:"premium" })
  })
  if (btResult?.extended) {
    console.log("     extended.costRange:", JSON.stringify(btResult.extended.costRange))
    console.log("     extended.confidenceScore:", btResult.extended.confidenceScore)
    console.log("     extended.elementalBreakdown:", btResult.extended.elementalBreakdown?.length, "elements")
    console.log("     extended.professionalFees:", btResult.extended.professionalFees?.length, "fees")
    console.log("     extended.totalProfessionalFees:", btResult.extended.totalProfessionalFees)
  }

  await test("GET /api/rates", BASE + "/api/rates")
  await test("GET /api/health", BASE + "/api/health")

  // ═══════ V1 API ═══════
  console.log("\n=== V1 API (auth required) ===")
  await test("GET /api/v1", BASE + "/api/v1")
  await test("POST /api/v1/estimate (no key)", BASE + "/api/v1/estimate", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ building_type:"residential", location:"Greater Accra", floor_area:200 })
  })
  await test("GET /api/v1/building-types (no key)", BASE + "/api/v1/building-types")
  await test("GET /api/v1/locations (no key)", BASE + "/api/v1/locations")
  await test("GET /api/v1/cost-rates (no key)", BASE + "/api/v1/cost-rates")
  await test("GET /api/v1/permit-requirements (no key)", BASE + "/api/v1/permit-requirements")

  // ═══════ ESTIMATES ═══════
  console.log("\n=== ESTIMATES (session required) ===")
  await test("GET /api/estimates (no auth)", BASE + "/api/estimates")

  // ═══════ PAGES ═══════
  console.log("\n=== PAGES ===")
  await test("GET /", BASE + "/")
  await test("GET /calculator", BASE + "/calculator")
  await test("GET /pricing", BASE + "/pricing")
  await test("GET /blog", BASE + "/blog")
  await test("GET /contact", BASE + "/contact")
  await test("GET /costs", BASE + "/costs")
  await test("GET /contractors", BASE + "/contractors")

  console.log("\nDone!")
}

run()
