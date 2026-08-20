import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json({
    name: "BuildCostGH API",
    version: "v1",
    description: "Ghana Building Cost Intelligence Platform — deterministic cost estimates, permit intelligence, and professional fee calculations.",
    documentation: "https://buildcostgh.com/api-pricing",
    llms: "https://buildcostgh.com/llms.txt",
    endpoints: {
      estimate: {
        method: "POST",
        path: "/api/v1/estimate",
        description: "Get a building cost estimate",
        auth: "Bearer API key required",
        body: {
          building_type: { type: "string", required: true, description: "Building category slug" },
          building_subtype: { type: "string", required: false, description: "Specific subtype slug" },
          location: { type: "string", required: true, description: "Ghana region or city" },
          floor_area: { type: "number", required: true, description: "Total floor area in m²" },
          floors: { type: "number", required: false, default: 1, description: "Number of floors" },
          quality: { type: "string", required: false, default: "standard", enum: ["economy", "standard", "good", "premium", "luxury"] },
          bedrooms: { type: "string", required: false, description: "Bedrooms (residential only)" },
        },
      },
      buildingTypes: { method: "GET", path: "/api/v1/building-types", description: "List building categories and subtypes" },
      locations: { method: "GET", path: "/api/v1/locations", description: "List Ghana regions with cost multipliers" },
      costRates: { method: "GET", path: "/api/v1/cost-rates", description: "Regional construction cost rates", params: { region: "Filter by region slug" } },
      permitRequirements: { method: "GET", path: "/api/v1/permit-requirements", description: "Permit requirements by category and building type", params: { category: "Filter by category", building_type: "Filter by building type slug" } },
    },
    categories: ["residential", "commercial", "industrial", "educational", "healthcare", "hospitality", "religious", "agricultural", "mixed_use", "institutional", "recreational", "infrastructure", "special_purpose"],
    qualityLevels: ["economy", "standard", "good", "premium", "luxury"],
    regions: 16,
    currency: "GHS",
  })
}
