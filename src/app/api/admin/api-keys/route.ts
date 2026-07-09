import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, lastUsedAt: true, active: true, createdAt: true, expiresAt: true, keyHash: true },
  })
  return NextResponse.json(keys)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { label } = await req.json()
  if (!label || typeof label !== "string") {
    return NextResponse.json({ error: "Label is required" }, { status: 400 })
  }

  const crypto = await import("node:crypto")
  const rawKey = `bcg_${crypto.randomBytes(24).toString("hex")}`
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex")

  const apiKey = await prisma.apiKey.create({
    data: { label, keyHash },
  })

  return NextResponse.json({
    id: apiKey.id,
    label: apiKey.label,
    rawKey,
    note: "Save this key — it will not be shown again",
  })
}
