import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { name, email, phone } = await request.json()

    if (!name || !email || !email.includes("@") || !phone) {
      return NextResponse.json({ error: "Name, valid email, and phone required" }, { status: 400 })
    }

    // Store as a contact message for lead tracking
    await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone,
        subject: "Flood Risk Report Download",
        message: `Lead magnet signup: Requested the Complete Flood Risk Report. Name: ${name}, Email: ${email}, Phone: ${phone}`,
      },
    })

    // Also subscribe to newsletter
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { name, subscribed: true },
      create: { email, name },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 })
  }
}
