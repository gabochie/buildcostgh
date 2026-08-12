import { NextRequest, NextResponse } from "next/server"
import { initializePayment } from "@/lib/paystack"
import { generateReference } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { validatePackageAmount } from "@/lib/pricing"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fullName, email, phone, packageName, amount, metadata } = body

    if (!email || !fullName || !packageName || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const serverAmount = await validatePackageAmount(String(packageName), Number(amount))
    if (serverAmount === null) {
      return NextResponse.json({ error: "Invalid package or amount" }, { status: 400 })
    }

    const session = await auth()

    const reference = generateReference()

    await prisma.order.create({
      data: {
        fullName,
        email,
        phone,
        package: packageName,
        amount: serverAmount,
        reference,
        metadata: metadata || {},
        status: "pending",
        userId: session?.user?.id ?? null,
      },
    })

    const response = await initializePayment({
      email,
      amount: serverAmount,
      reference,
      metadata: { fullName, phone, package: packageName, ...(metadata || {}) },
    })

    if (!response.status) {
      throw new Error(response.message || "Payment initialization failed")
    }

    return NextResponse.json({ authorizationUrl: response.data.authorization_url, reference })
  } catch (error) {
    console.error("Paystack init error:", error)
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 })
  }
}
