import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json([])
  }

  const where = session?.user?.id
    ? { OR: [{ userId: session.user.id }, { email: session.user.email || "" }] }
    : { email: session.user.email || "" }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      package: true,
      amount: true,
      status: true,
      reference: true,
      reportUrl: true,
      createdAt: true,
    },
  })

  return NextResponse.json(orders)
}
