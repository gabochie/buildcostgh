import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

const regionMultipliers: Record<string, number> = {
  accra: 1.0, kumasi: 0.85, tema: 0.9, takoradi: 0.8, tamale: 0.7,
  "cape-coast": 0.75, sunyani: 0.72, ho: 0.68, koforidua: 0.7, bolgatanga: 0.65,
  wa: 0.67, goaso: 0.7, techiman: 0.73, dambai: 0.69, "sefwi-wiawso": 0.76,
  nalerigu: 0.63, damongo: 0.66,
}

const bedCosts: Record<string, { min: number; max: number }> = {
  "1": { min: 180000, max: 350000 },
  "2": { min: 250000, max: 650000 },
  "3": { min: 400000, max: 1000000 },
  "4": { min: 600000, max: 1400000 },
  "5": { min: 900000, max: 2000000 },
  "6+": { min: 1200000, max: 3500000 },
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { bedrooms?: string | number; location?: string; finishGrade?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { bedrooms, location, finishGrade = "standard" } = body

  if (!bedrooms || !location) {
    return NextResponse.json({ error: "bedrooms and location required" }, { status: 400 })
  }

  const locSlug = location.toLowerCase().replace(/\s+/g, "-")
  const multiplier = regionMultipliers[locSlug] ?? 0.85
  const bedRange = bedCosts[String(bedrooms)] ?? bedCosts["3"]

  const gradeMultiplier = finishGrade === "premium" ? 1.5 : finishGrade === "basic" ? 0.7 : 1.0
  const min = Math.round(bedRange.min * multiplier * gradeMultiplier)
  const max = Math.round(bedRange.max * multiplier * gradeMultiplier)

  return NextResponse.json({
    success: true,
    data: {
      estimate: { min, max, currency: "GHS" },
      details: { bedrooms: String(bedrooms), location, finishGrade },
      breakdown: {
        materials: Math.round(min * 0.55),
        labour: Math.round(min * 0.25),
        supervision: Math.round(min * 0.08),
        contingency: Math.round(min * 0.12),
      },
    },
    meta: { requestedBy: auth.key.label, tier: auth.key.tier },
  })
}