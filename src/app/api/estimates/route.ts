import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

// GET /api/estimates — list saved estimates for current user/email
export async function GET(req: NextRequest) {
  const session = await auth()
  const email = req.nextUrl.searchParams.get("email")

  const where: Record<string, unknown> = {}
  if (session?.user?.id) {
    where.userId = session.user.id
  } else if (email) {
    where.email = email
  } else {
    return NextResponse.json([])
  }

  const estimates = await prisma.savedEstimate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(estimates)
}

// POST /api/estimates — save a new estimate
export async function POST(req: NextRequest) {
  const session = await auth()
  const body = await req.json()

  if (!body.projectName || !body.inputs || !body.result) {
    return NextResponse.json({ error: "projectName, inputs, and result are required" }, { status: 400 })
  }

  const estimate = await prisma.savedEstimate.create({
    data: {
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? body.email ?? null,
      projectName: body.projectName,
      buildingType: body.buildingType ?? "residential",
      location: body.location ?? "",
      floorArea: Number(body.floorArea) || 0,
      floors: Number(body.floors) || 1,
      qualityLevel: body.qualityLevel ?? "standard",
      inputs: body.inputs,
      result: body.result,
      groupId: body.groupId ?? null,
      notes: body.notes ?? null,
    },
  })

  return NextResponse.json(estimate)
}
