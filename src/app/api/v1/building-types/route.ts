import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { authenticateApiKey, apiKeyErrorResponse } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return apiKeyErrorResponse(auth)

  const categories = await prisma.buildingCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      subtypes: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true, complexity: true, typicalMinFloors: true, typicalMaxFloors: true },
      },
    },
  })

  return NextResponse.json({
    success: true,
    data: categories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      description: c.description,
      subtypes: c.subtypes,
    })),
    meta: { requestedBy: auth.key.label, tier: auth.key.tier },
  })
}
