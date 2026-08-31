import { NextRequest, NextResponse } from "next/server"
import { requestToPay } from "@/lib/momo"
import { generateReference } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { validatePackageAmount } from "@/lib/pricing"
import { auth } from "@/lib/auth"
import { apiRateLimit } from "@/lib/rate-limit"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  // Each call triggers a real MTN USSD push to a phone number, so it must be
  // tightly rate-limited per IP to prevent automated MoMo push abuse.
  const rate = await apiRateLimit(request, { maxRequests: 10, path: "momo-init" })
  if (!rate.ok && rate.response) return rate.response

  const idempotencyKey = request.headers.get("Idempotency-Key")
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Missing Idempotency-Key header" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { fullName, email, phone, packageName, amount, metadata } = body

    if (!phone || !fullName || !packageName || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const cleanedPhone = phone.replace(/\s/g, "").replace(/^0/, "233")
    if (!/^233\d{9}$/.test(cleanedPhone)) {
      return NextResponse.json({ error: "Invalid Ghana phone number" }, { status: 400 })
    }

    const serverAmount = await validatePackageAmount(String(packageName), Number(amount))
    if (serverAmount === null) {
      return NextResponse.json({ error: "Invalid package or amount" }, { status: 400 })
    }

    const session = await auth()
    const reference = generateReference()
    const referenceId = crypto.randomUUID()

    const existing = await prisma.order.findUnique({ where: { idempotencyKey } })
    if (existing) {
      return NextResponse.json({
        reference: existing.reference,
        referenceId: existing.referenceId || referenceId,
        duplicate: true,
        message: "Payment already initiated.",
      })
    }

    await prisma.order.create({
      data: {
        fullName,
        email: email || "",
        phone: cleanedPhone,
        package: packageName,
        amount: serverAmount,
        reference,
        referenceId,
        metadata: metadata || {},
        status: "pending",
        idempotencyKey,
        userId: session?.user?.id ?? null,
      },
    })

    await requestToPay({
      referenceId,
      amount: String(serverAmount),
      currency: "GHS",
      phone: cleanedPhone,
      payerMessage: `Payment for ${packageName} - BuildCostGH`,
      payeeNote: `Order ${reference}`,
    })

    return NextResponse.json({
      reference,
      referenceId,
      message: "Payment request sent to your phone. Please approve on your MoMo device.",
    })
  } catch (error) {
    console.error("MoMo init error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment initialization failed" },
      { status: 500 }
    )
  }
}
