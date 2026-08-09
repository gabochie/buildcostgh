import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")?.toLowerCase()
  const region = searchParams.get("region")
  const specialty = searchParams.get("specialty")
  const verified = searchParams.get("verified")
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100)
  const offset = Number(searchParams.get("offset")) || 0

  const where: Prisma.ContractorWhereInput = { status: "active" }

  if (verified === "true") where.verified = true

  if (region) {
    const regionRecord = await prisma.region.findUnique({ where: { slug: region } })
    if (regionRecord) {
      where.regions = { some: { regionId: regionRecord.id } }
    }
  }

  if (specialty) {
    where.specialties = { array_contains: specialty }
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ]
  }

  const [contractors, total] = await Promise.all([
    prisma.contractor.findMany({
      where,
      include: { regions: { include: { region: true } } },
      orderBy: [{ verified: "desc" }, { rating: "desc" }, { reviewCount: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.contractor.count({ where }),
  ])

  return NextResponse.json({ contractors, total, limit, offset })
}