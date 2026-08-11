import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const contractor = await prisma.contractor.findUnique({
    where: { slug },
    include: {
      regions: { include: { region: true } },
      sources: { orderBy: { confidence: "desc" } },
      projects: { orderBy: { sort: "asc" } },
    },
  })

  if (!contractor || contractor.status !== "active") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(contractor)
}