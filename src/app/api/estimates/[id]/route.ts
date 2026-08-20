import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

// GET /api/estimates/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const estimate = await prisma.savedEstimate.findUnique({ where: { id } })
  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(estimate)
}

// PUT /api/estimates/[id] — update name, notes, favorite, or regenerate
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const existing = await prisma.savedEstimate.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.savedEstimate.update({
    where: { id },
    data: {
      projectName: body.projectName ?? existing.projectName,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      isFavorite: body.isFavorite !== undefined ? body.isFavorite : existing.isFavorite,
      result: body.result ?? existing.result,
      inputs: body.inputs ?? existing.inputs,
      version: body.result ? existing.version + 1 : existing.version,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/estimates/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.savedEstimate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
