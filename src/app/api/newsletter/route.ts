import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { subscribed: true },
      create: { email },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(subscribers)
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { email } = await request.json()
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  await prisma.newsletterSubscriber.update({
    where: { email },
    data: { subscribed: false },
  })

  return NextResponse.json({ success: true })
}
