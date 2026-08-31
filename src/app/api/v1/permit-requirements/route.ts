import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey, apiKeyErrorResponse } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return apiKeyErrorResponse(auth)

  const category = req.nextUrl.searchParams.get("category")
  const buildingType = req.nextUrl.searchParams.get("building_type")

  const where: Record<string, unknown> = { isActive: true }
  if (category) where.category = category

  const requirements = await prisma.permitRequirement.findMany({
    where,
    orderBy: { sortOrder: "asc" },
  })

  // Optionally filter by building type using the appliesTo JSON
  const filtered = buildingType
    ? requirements.filter(r => {
        const applies = r.appliesTo as Record<string, unknown>
        const cats = applies?.buildingCategories as string[] | undefined
        return !Array.isArray(cats) || cats.includes(buildingType)
      })
    : requirements

  return NextResponse.json({
    success: true,
    data: filtered.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      required: r.required,
      appliesTo: r.appliesTo,
      authority: r.authority,
      source: r.source,
      notes: r.notes,
    })),
    meta: { requestedBy: auth.key.label, tier: auth.key.tier, count: filtered.length },
  })
}
