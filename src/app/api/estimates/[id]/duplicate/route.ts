import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

// POST /api/estimates/[id]/duplicate — duplicate an estimate as a new scenario
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()

  const original = await prisma.savedEstimate.findUnique({ where: { id } })
  if (!original) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Use existing groupId or create a new one from the original id
  const groupId = original.groupId ?? original.id

  const duplicate = await prisma.savedEstimate.create({
    data: {
      userId: session?.user?.id ?? original.userId,
      email: session?.user?.email ?? original.email,
      projectName: `${original.projectName} (Copy)`,
      buildingType: original.buildingType,
      location: original.location,
      floorArea: original.floorArea,
      floors: original.floors,
      qualityLevel: original.qualityLevel,
      inputs: original.inputs as Prisma.InputJsonValue,
      result: original.result as Prisma.InputJsonValue,
      groupId,
      notes: null,
    },
  })

  return NextResponse.json(duplicate)
}
