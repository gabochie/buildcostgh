import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function POST() {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await prisma.job.deleteMany({
    where: { status: { in: ["pending", "failed"] } },
  })
  return NextResponse.json({ deleted: result.count })
}
