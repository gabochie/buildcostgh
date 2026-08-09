import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!isAdmin(session?.user)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  await prisma.apiKey.delete({ where: { id } })
  return NextResponse.json({ deleted: true })
}
