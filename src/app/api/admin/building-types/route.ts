import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [categories, subtypes, profiles] = await Promise.all([
    prisma.buildingCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.buildingSubtype.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.costProfile.findMany({ orderBy: { buildingCategorySlug: "asc" } }),
  ])

  return NextResponse.json({ categories, subtypes, profiles })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.type || !body.data) {
    return NextResponse.json({ error: "type (category|subtype|profile) and data required" }, { status: 400 })
  }

  try {
    let result
    switch (body.type) {
      case "category":
        result = await prisma.buildingCategory.create({ data: body.data })
        break
      case "subtype":
        result = await prisma.buildingSubtype.create({ data: body.data })
        break
      case "profile":
        result = await prisma.costProfile.create({ data: body.data })
        break
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.type || !body.slug) {
    return NextResponse.json({ error: "type and slug required" }, { status: 400 })
  }

  try {
    if (body.type === "category") {
      await prisma.costProfile.deleteMany({ where: { buildingCategorySlug: body.slug } })
      await prisma.buildingSubtype.deleteMany({ where: { buildingCategorySlug: body.slug } })
      await prisma.buildingCategory.delete({ where: { slug: body.slug } })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
