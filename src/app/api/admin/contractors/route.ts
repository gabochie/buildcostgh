import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contractors = await prisma.contractor.findMany({
    include: { regions: { include: { region: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(contractors)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { regions: regionNames, ...data } = body

  const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

  const contractor = await prisma.contractor.create({
    data: { ...data, slug },
  })

  if (regionNames?.length) {
    const regions = await prisma.region.findMany({ where: { name: { in: regionNames } } })
    for (const region of regions) {
      await prisma.contractorRegion.create({
        data: { contractorId: contractor.id, regionId: region.id },
      })
    }
  }

  return NextResponse.json(contractor, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, regions: regionNames, ...data } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const contractor = await prisma.contractor.update({ where: { id }, data })

  if (regionNames) {
    await prisma.contractorRegion.deleteMany({ where: { contractorId: id } })
    const regions = await prisma.region.findMany({ where: { name: { in: regionNames } } })
    for (const region of regions) {
      await prisma.contractorRegion.create({
        data: { contractorId: id, regionId: region.id },
      })
    }
  }

  return NextResponse.json(contractor)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await prisma.contractor.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}