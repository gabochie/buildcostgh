import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.buildingCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        subtypes: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            complexity: true,
            typicalMinFloors: true,
            typicalMaxFloors: true,
          },
        },
        costProfiles: {
          where: { isActive: true, subtypeId: null },
          select: {
            qualityLevel: true,
            baseCostPerSqm: true,
            confidenceLevel: true,
            source: true,
          },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ error: "Failed to fetch building types" }, { status: 500 })
  }
}
