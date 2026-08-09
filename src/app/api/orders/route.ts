import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api-auth"

export async function GET() {
  const session = await auth()
  if (!isAdmin(session?.user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(orders)
}
