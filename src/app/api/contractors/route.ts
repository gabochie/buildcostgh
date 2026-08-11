import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

const CLASS_FIELDS = [
  "mwhBuildingClass",
  "mwhCivilClass",
  "mwhElectricalClass",
  "mwhPlumbingClass",
  "mrhRoadClass",
] as const

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.toLowerCase()
  const region = searchParams.get("region")
  const specialty = searchParams.get("specialty")
  const verified = searchParams.get("verified")
  const classification = searchParams.get("classification") // e.g. "D1", "K2", "E1", "G1"
  const projectScale = searchParams.get("projectScale")
  const verificationLevel = Number(searchParams.get("verificationLevel")) || 0 // minimum 0-5
  const featured = searchParams.get("featured")
  const sort = searchParams.get("sort") || "default"
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100)
  const offset = Number(searchParams.get("offset")) || 0

  const where: Prisma.ContractorWhereInput = { status: "active" }

  if (verified === "true") where.verified = true

  if (region) {
    const regionRecord = await prisma.region.findUnique({ where: { slug: region } })
    if (regionRecord) {
      where.regions = { some: { regionId: regionRecord.id } }
    } else {
      // Fall back to matching the contractor-level region string (e.g. "Greater Accra")
      where.region = { contains: region, mode: "insensitive" }
    }
  }

  if (specialty) {
    where.specialties = { array_contains: specialty }
  }

  if (classification) {
    where.OR = CLASS_FIELDS.map((field) => ({
      [field]: { contains: classification, mode: "insensitive" },
    }))
  }

  if (projectScale) {
    where.projectScale = projectScale
  }

  if (verificationLevel > 0) {
    where.verificationLevel = { gte: verificationLevel }
  }

  if (featured === "true") {
    where.featured = true
  }

  if (search) {
    where.OR = [
      ...(where.OR && Array.isArray(where.OR) ? (where.OR as Prisma.ContractorWhereInput[]) : []),
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
    ]
  }

  const orderBy: Prisma.ContractorOrderByWithRelationInput[] =
    sort === "name"
      ? [{ name: "asc" }]
      : sort === "newest"
        ? [{ createdAt: "desc" }]
        : sort === "rating"
          ? [{ rating: "desc" }, { reviewCount: "desc" }]
          : [{ featured: "desc" }, { verified: "desc" }, { rating: "desc" }, { reviewCount: "desc" }]

  const [contractors, total] = await Promise.all([
    prisma.contractor.findMany({
      where,
      include: {
        regions: { include: { region: true } },
        sources: { orderBy: { confidence: "desc" } },
        projects: { orderBy: { sort: "asc" } },
      },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.contractor.count({ where }),
  ])

  return NextResponse.json({ contractors, total, limit, offset })
}
