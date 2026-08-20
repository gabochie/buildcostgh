// AI Readiness — Structured parameter extraction schema
// Converts natural language into validated estimate parameters.
// The calculation engine remains authoritative — AI never invents costs.

import { z } from "zod"

// ── Core estimate input schema (matches CalculationInput) ──
export const EstimateRequestSchema = z.object({
  building_type: z.string().describe("Building category slug, e.g. 'residential', 'commercial_office', 'educational_school'"),
  building_subtype: z.string().optional().describe("Specific building subtype slug, e.g. 'detached_house', 'office_block'"),
  location: z.string().describe("Region name or city, e.g. 'Greater Accra', 'Kumasi'"),
  floor_area: z.number().positive().describe("Total floor area in square meters"),
  floors: z.number().int().positive().max(50).default(1).describe("Number of floors/stories"),
  quality: z.enum(["economy", "standard", "good", "premium", "luxury"]).default("standard").describe("Construction quality level"),
  terrain: z.enum(["flat", "sloping", "steep"]).optional().describe("Site terrain condition"),
  access: z.enum(["easy", "moderate", "difficult"]).optional().describe("Site access difficulty"),
  setting: z.enum(["urban", "peri_urban", "rural"]).optional().describe("Site setting"),
  bedrooms: z.string().optional().describe("Number of bedrooms (residential only, e.g. '3', '4', '6+')"),
})

export type EstimateRequest = z.infer<typeof EstimateRequestSchema>

// ── AI extraction prompt template ──
export const AI_EXTRACTION_PROMPT = `You are a building cost estimation parameter extractor for BuildCostGH (Ghana).

Given a user's natural language description, extract the following structured parameters:

- building_type: Building category slug. Options: residential, commercial, industrial, educational, healthcare, hospitality, religious, agricultural, mixed_use, institutional, recreational, infrastructure, special_purpose
- building_subtype: Specific subtype if mentioned (optional)
- location: Region or city in Ghana
- floor_area: Total floor area in square meters
- floors: Number of floors (default 1)
- quality: Construction quality — economy | standard | good | premium | luxury (default: standard)
- terrain: flat | sloping | steep (optional)
- access: easy | moderate | difficult (optional)
- setting: urban | peri_urban | rural (optional)
- bedrooms: Number of bedrooms, residential only (optional)

Rules:
1. If the user says "house" or "home" with bedrooms, use building_type: "residential"
2. If floor area is not given, estimate from building type and bedrooms:
   - 1 bedroom ≈ 45-60 sqm, 2 bedroom ≈ 70-90 sqm, 3 bedroom ≈ 95-130 sqm
   - 4 bedroom ≈ 130-170 sqm, 5 bedroom ≈ 170-220 sqm, 6+ ≈ 220+ sqm
3. If floors not specified, default to 1
4. If quality not specified, default to "standard"
5. Ghana cities map to regions: Kumasi → Ashanti, Accra → Greater Accra, Tamale → Northern, etc.
6. Output ONLY valid JSON matching the EstimateRequest schema.
7. NEVER invent cost figures — only extract parameters.

Example input: "Estimate a 3-storey 24-classroom school in Kumasi, about 2000 sqm"
Example output: {"building_type":"educational_school","location":"Ashanti","floor_area":2000,"floors":3,"quality":"standard"}`

// ── AI explanation prompt template ──
export const AI_EXPLANATION_PROMPT = `You are a helpful building cost advisor for BuildCostGH (Ghana).

Given a cost estimate result, provide a clear, professional explanation:

1. Summarize the total cost and range
2. Identify the top 3 cost drivers
3. Explain what's included and excluded
4. Suggest 2-3 ways to reduce costs if applicable
5. Note any permit or regulatory requirements
6. Recommend next steps

Tone: Professional but accessible. Avoid jargon unless the user is a professional.
Never invent figures not in the provided data.
Never make regulatory claims without verified source data.`

// ── Validation helper ──
export function validateEstimateRequest(input: unknown): { success: true; data: EstimateRequest } | { success: false; errors: string[] } {
  const result = EstimateRequestSchema.safeParse(input)
  if (result.success) return { success: true, data: result.data }
  return { success: false, errors: result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`) }
}
