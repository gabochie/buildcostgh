import { NextResponse } from "next/server"
import { generatePermitChecklist, type PermitChecklistInput } from "@/lib/permit-engine"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { buildingCategorySlug, buildingSubtypeSlug, location, floorArea, floors, developmentType } = body

    if (!buildingCategorySlug || !location || !floorArea) {
      return NextResponse.json(
        { error: "buildingCategorySlug, location, and floorArea are required" },
        { status: 400 },
      )
    }

    const input: PermitChecklistInput = {
      buildingCategorySlug,
      buildingSubtypeSlug,
      location,
      floorArea: Number(floorArea),
      floors: Number(floors) || 1,
      developmentType: developmentType || 'new',
    }

    const result = await generatePermitChecklist(input)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: `Failed to generate permit checklist: ${e instanceof Error ? e.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
