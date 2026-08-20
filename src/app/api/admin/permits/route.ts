import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const [requirements, authorities] = await Promise.all([
    prisma.permitRequirement.findMany({ orderBy: { category: "asc" } }),
    prisma.authority.findMany({ orderBy: { name: "asc" } }),
  ])

  return NextResponse.json({ requirements, authorities })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  if (!body.type || !body.data) {
    return NextResponse.json({ error: "type (requirement|authority) and data required" }, { status: 400 })
  }

  try {
    let result
    switch (body.type) {
      case "requirement":
        result = await prisma.permitRequirement.create({ data: body.data })
        break
      case "authority":
        result = await prisma.authority.create({ data: body.data })
        break
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 })
  }
}
