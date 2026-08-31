import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

// GET /api/estimates — list saved estimates for the signed-in user.
// A customer may only ever read their own estimates (by userId/email); only
// admins may query by an arbitrary ?email= for support/reconciliation.
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const viewerId = session.user.id
  const viewerEmail = session.user.email?.toLowerCase()
  const queriedEmail = req.nextUrl.searchParams.get("email")?.toLowerCase()

  const ownMatch = {
    OR: [
      ...(viewerId ? [{ userId: viewerId }] : []),
      ...(viewerEmail ? [{ email: { equals: viewerEmail, mode: "insensitive" as const } }] : []),
    ],
  }

  const where = isAdmin(session.user) && queriedEmail ? { email: { equals: queriedEmail, mode: "insensitive" as const } } : ownMatch

  const estimates = await prisma.savedEstimate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(estimates)
}

// POST /api/estimates — save a new estimate (authenticated only, scoped to the user)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (!body.projectName || !body.inputs || !body.result) {
    return NextResponse.json({ error: "projectName, inputs, and result are required" }, { status: 400 })
  }

  const estimate = await prisma.savedEstimate.create({
    data: {
      userId: session.user.id,
      email: session.user.email ?? null,
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
